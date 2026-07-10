const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const FREE_CHAT_SECONDS = 60;

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
  return wallet;
};

const deductWallet = async (userId, amount, description) => {
  const wallet = await getOrCreateWallet(userId);
  if (wallet.balance < amount) {
    throw new Error(`Insufficient balance. Need ₹${amount}, you have ₹${wallet.balance}`);
  }
  wallet.balance -= amount;
  await wallet.save();
  await Transaction.create({
    user: userId,
    amount,
    type: 'debit',
    description,
    status: 'completed',
  });
  return wallet.balance;
};

const creditWallet = async (userId, amount, description) => {
  if (!amount || amount <= 0) return null;
  const wallet = await getOrCreateWallet(userId);
  wallet.balance += amount;
  await wallet.save();
  await Transaction.create({
    user: userId,
    amount,
    type: 'credit',
    description,
    status: 'completed',
  });
  return wallet.balance;
};

async function updateSessionTimer(chat) {
  if (chat.status !== 'active' || !chat.lastTickAt) return chat;

  const now = Date.now();
  const elapsed = Math.floor((now - new Date(chat.lastTickAt).getTime()) / 1000);
  if (elapsed <= 0) return chat;

  let remaining = elapsed;
  let freeRem = chat.freeSecondsRemaining || 0;
  let paidRem = chat.paidSecondsRemaining || 0;

  if (chat.type === 'chat' && freeRem > 0) {
    const used = Math.min(remaining, freeRem);
    freeRem -= used;
    remaining -= used;
  }

  if (remaining > 0 && paidRem > 0) {
    const used = Math.min(remaining, paidRem);
    paidRem -= used;
    remaining -= used;
  }

  chat.freeSecondsRemaining = freeRem;
  chat.paidSecondsRemaining = paidRem;
  chat.lastTickAt = new Date();

  const hasTime = freeRem > 0 || paidRem > 0;
  if (!hasTime) {
    chat.status = 'paused';
    chat.requiresPayment = true;
    chat.messages.push({
      sender: 'system',
      content:
        chat.type === 'call'
          ? 'Call time ended. Recharge minutes to continue.'
          : 'Free/paid time ended. Recharge to continue chat.',
    });
  }

  return chat;
}

function getBillingState(chat) {
  const freeRem = chat.freeSecondsRemaining || 0;
  const paidRem = chat.paidSecondsRemaining || 0;
  const totalSec = freeRem + paidRem;

  let canChat = false;
  if (chat.status === 'pending') canChat = false;
  else if (chat.status === 'ended' || chat.status === 'rejected') canChat = false;
  else if (chat.type === 'call' && !chat.callPaidUpfront) canChat = false;
  else if (chat.status === 'paused' || chat.requiresPayment) canChat = false;
  else if (chat.status === 'active') canChat = totalSec > 0;
  else if (chat.status === 'accepted') canChat = false;

  let phase = 'waiting';
  if (chat.status === 'pending') phase = 'waiting';
  else if (chat.status === 'rejected') phase = 'rejected';
  else if (chat.status === 'ended') phase = 'ended';
  else if (chat.type === 'call' && !chat.callPaidUpfront) phase = 'payment_required';
  else if (chat.status === 'paused' || chat.requiresPayment) phase = 'paused';
  else if (chat.status === 'active' && chat.type === 'chat' && freeRem > 0) phase = 'free';
  else if (chat.status === 'active') phase = 'paid';

  return {
    status: chat.status,
    type: chat.type,
    canChat,
    canAccept: chat.type === 'call' ? !!chat.callPaidUpfront : true,
    requiresPayment: !!chat.requiresPayment || chat.status === 'paused',
    freeSecondsRemaining: freeRem,
    paidSecondsRemaining: paidRem,
    totalSecondsRemaining: totalSec,
    phase,
    pricePerMin: chat.pricePerMin,
    totalCharged: chat.totalCharged || 0,
    callPaidUpfront: !!chat.callPaidUpfront,
  };
}

async function payForMinutes(chat, minutes) {
  if (!minutes || minutes < 1) throw new Error('Minimum 1 minute required');
  const cost = chat.pricePerMin * minutes;
  const balance = await deductWallet(
    chat.user,
    cost,
    `${chat.type} consultation — ${minutes} min with astrologer`
  );

  chat.paidSecondsRemaining = (chat.paidSecondsRemaining || 0) + minutes * 60;
  chat.totalCharged = (chat.totalCharged || 0) + cost;
  chat.requiresPayment = false;

  if (chat.type === 'call' && !chat.callPaidUpfront) {
    chat.callPaidUpfront = true;
  }

  if (chat.status === 'paused') {
    chat.status = 'active';
    chat.isActive = true;
    chat.lastTickAt = new Date();
  }

  chat.messages.push({
    sender: 'system',
    content: `₹${cost} paid for ${minutes} minute${minutes > 1 ? 's' : ''}.`,
  });

  return { balance, cost, minutes };
}

function getDurationSeconds(chat) {
  const start = chat.startedAt || chat.acceptedAt || null;
  if (!start) return 0;
  const end =
    chat.endedAt ||
    (['active', 'paused', 'accepted'].includes(chat.status) ? new Date() : null);
  if (!end) return 0;
  return Math.max(0, Math.floor((new Date(end) - new Date(start)) / 1000));
}

function formatSession(chat) {
  const billing = getBillingState(chat);
  const birth = chat.userBirthDetails || {};
  const durationSeconds = getDurationSeconds(chat);
  return {
    _id: chat._id,
    user: chat.user,
    astrologer: chat.astrologer,
    type: chat.type,
    status: chat.status,
    messages: chat.messages,
    userBirthDetails: {
      name: birth.name || '',
      dateOfBirth: birth.dateOfBirth || '',
      timeOfBirth: birth.timeOfBirth || '',
      placeOfBirth: birth.placeOfBirth || '',
      gender: birth.gender || '',
    },
    isActive: chat.isActive,
    pricePerMin: chat.pricePerMin,
    startedAt: chat.startedAt,
    acceptedAt: chat.acceptedAt,
    endedAt: chat.endedAt,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    agoraChannel: chat.agoraChannel || (chat._id ? `session_${chat._id}` : ''),
    callPaidUpfront: !!chat.callPaidUpfront,
    durationSeconds,
    billing: {
      ...billing,
      durationSeconds,
    },
  };
}

module.exports = {
  FREE_CHAT_SECONDS,
  updateSessionTimer,
  getBillingState,
  payForMinutes,
  deductWallet,
  creditWallet,
  formatSession,
};