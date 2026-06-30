const express = require('express');
const ctrl = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', ctrl.login);
router.get('/me', adminProtect, ctrl.getMe);
router.get('/dashboard', adminProtect, ctrl.getDashboard);

router.get('/users', adminProtect, ctrl.listUsers);
router.put('/users/:id', adminProtect, ctrl.updateUser);
router.delete('/users/:id', adminProtect, ctrl.deleteUser);

router.get('/astrologers', adminProtect, ctrl.astrologers.list);
router.post('/astrologers', adminProtect, ctrl.astrologers.create);
router.put('/astrologers/:id', adminProtect, ctrl.astrologers.update);
router.delete('/astrologers/:id', adminProtect, ctrl.astrologers.remove);

router.get('/products', adminProtect, ctrl.products.list);
router.post('/products', adminProtect, ctrl.products.create);
router.put('/products/:id', adminProtect, ctrl.products.update);
router.delete('/products/:id', adminProtect, ctrl.products.remove);

router.get('/blogs', adminProtect, ctrl.blogs.list);
router.post('/blogs', adminProtect, ctrl.blogs.create);
router.put('/blogs/:id', adminProtect, ctrl.blogs.update);
router.delete('/blogs/:id', adminProtect, ctrl.blogs.remove);

router.get('/news', adminProtect, ctrl.news.list);
router.post('/news', adminProtect, ctrl.news.create);
router.put('/news/:id', adminProtect, ctrl.news.update);
router.delete('/news/:id', adminProtect, ctrl.news.remove);

router.get('/poojas', adminProtect, ctrl.poojas.list);
router.post('/poojas', adminProtect, ctrl.poojas.create);
router.put('/poojas/:id', adminProtect, ctrl.poojas.update);
router.delete('/poojas/:id', adminProtect, ctrl.poojas.remove);

router.get('/orders', adminProtect, ctrl.listOrders);
router.put('/orders/:id', adminProtect, ctrl.updateOrder);

router.get('/transactions', adminProtect, ctrl.listTransactions);

router.get('/gift-cards', adminProtect, ctrl.listGiftCards);
router.post('/gift-cards', adminProtect, ctrl.createGiftCard);
router.put('/gift-cards/:id', adminProtect, ctrl.updateGiftCard);
router.delete('/gift-cards/:id', adminProtect, ctrl.deleteGiftCard);

router.get('/testimonials', adminProtect, ctrl.testimonials.list);
router.post('/testimonials', adminProtect, ctrl.testimonials.create);
router.put('/testimonials/:id', adminProtect, ctrl.testimonials.update);
router.delete('/testimonials/:id', adminProtect, ctrl.testimonials.remove);

router.get('/support-faqs', adminProtect, ctrl.supportFaqs.list);
router.post('/support-faqs', adminProtect, ctrl.supportFaqs.create);
router.put('/support-faqs/:id', adminProtect, ctrl.supportFaqs.update);
router.delete('/support-faqs/:id', adminProtect, ctrl.supportFaqs.remove);

router.get('/free-services', adminProtect, ctrl.freeServices.list);
router.post('/free-services', adminProtect, ctrl.freeServices.create);
router.put('/free-services/:id', adminProtect, ctrl.freeServices.update);
router.delete('/free-services/:id', adminProtect, ctrl.freeServices.remove);

module.exports = router;