import CrudPage from '../components/CrudPage';

export default function SupportFaqs() {
  return (
    <CrudPage
      title="Support FAQs"
      subtitle="Manage customer support questions"
      endpoint="/support-faqs"
      wide
      defaultItem={{ question: '', answer: '', category: 'general', order: 0 }}
      columns={[
        { key: 'question', label: 'Question' },
        { key: 'category', label: 'Category' },
        { key: 'order', label: 'Order' },
      ]}
      fields={[
        { key: 'question', label: 'Question', required: true, full: true },
        { key: 'answer', label: 'Answer', type: 'textarea', rows: 4, full: true },
        { key: 'category', label: 'Category', type: 'select', options: [
          { value: 'general', label: 'General' },
          { value: 'wallet', label: 'Wallet' },
          { value: 'chat', label: 'Chat' },
          { value: 'pooja', label: 'Pooja' },
          { value: 'refund', label: 'Refund' },
        ]},
        { key: 'order', label: 'Display Order', type: 'number' },
      ]}
    />
  );
}