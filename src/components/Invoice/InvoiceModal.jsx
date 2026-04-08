import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import InvoicePrint from './InvoicePrint';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { generatePDF } from '../../utils/pdf';
import { Printer, Download } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, saleId }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && saleId) {
      loadSale();
    }
  }, [isOpen, saleId]);

  const loadSale = async () => {
    setLoading(true);
    const res = await window.electronAPI.sales.getById(saleId);
    if (res.success) {
      setSale(res.data);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (sale) {
      await generatePDF('invoice-print-area', `Invoice-${sale.invoice_number}`);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Details" size="md">
      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : sale ? (
        <>
          <div className="max-h-[60vh] overflow-y-auto mb-4 bg-white text-black p-4 rounded-lg">
            <InvoicePrint sale={sale} />
          </div>
          <div className="flex justify-end gap-3 no-print mt-4">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={handleDownload} className="gap-2">
              <Download size={16} /> Save PDF
            </Button>
            <Button variant="success" onClick={handlePrint} className="gap-2">
              <Printer size={16} /> Print Receipt
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-dark-400">Sale not found</div>
      )}
    </Modal>
  );
}
