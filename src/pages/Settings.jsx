import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { Save, Download, Upload } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const success = await updateSettings(formData);
    if (success) toast.success('Settings saved successfully');
  };

  const handleBackup = async () => {
    const res = await window.electronAPI.backup.create();
    if (res.success) toast.success(res.message);
    else if (res.message !== 'Cancelled') toast.error(res.message);
  };

  const handleRestore = async () => {
    if (window.confirm('Restoring will overwrite current database. Continue?')) {
      const res = await window.electronAPI.backup.restore();
      if (res.success) {
        toast.success(res.message);
      } else if (res.message !== 'Cancelled') {
        toast.error(res.message);
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-dark-400 mt-1">Configure your store preferences and system data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-dark-700 pb-2">General Settings</h3>
          <form id="settings-form" onSubmit={handleSave} className="space-y-4">
            <Input label="Shop Name" name="shop_name" value={formData.shop_name || ''} onChange={handleChange} />
            <Input label="Phone Number" name="shop_phone" value={formData.shop_phone || ''} onChange={handleChange} />
            <Input label="Email" name="shop_email" value={formData.shop_email || ''} onChange={handleChange} />
            
            <div>
              <label className="label">Shop Address</label>
              <textarea 
                className="input h-20" name="shop_address" 
                value={formData.shop_address || ''} onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Currency (e.g. USD)" name="currency" value={formData.currency || ''} onChange={handleChange} />
              <Input label="Symbol (e.g. $)" name="currency_symbol" value={formData.currency_symbol || ''} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Tax Rate (%)" name="tax_rate" type="number" step="0.01" value={formData.tax_rate || ''} onChange={handleChange} />
              <Input label="Invoice Prefix" name="invoice_prefix" value={formData.invoice_prefix || ''} onChange={handleChange} />
            </div>

            <Button type="submit" variant="primary" className="w-full gap-2 mt-4">
              <Save size={18} /> Save Settings
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-dark-700 pb-2">System Data</h3>
            <div className="space-y-4">
              <div className="p-4 bg-dark-900 border border-dark-700 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-1">Backup Database</h4>
                <p className="text-xs text-dark-400 mb-3">Export all data to a local file.</p>
                <Button variant="secondary" onClick={handleBackup} className="w-full gap-2">
                  <Download size={16} /> Create Backup
                </Button>
              </div>

              <div className="p-4 bg-dark-900 border border-danger-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-1">Restore Database</h4>
                <p className="text-xs text-dark-400 mb-3">Load data from a previous backup file.</p>
                <Button variant="danger" onClick={handleRestore} className="w-full gap-2">
                  <Upload size={16} /> Restore Backup
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
