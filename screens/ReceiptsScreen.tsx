

import React, { useState, useMemo } from 'react';
import type { Receipt } from '../types';

const mockReceipts: Receipt[] = [
  { id: 'R003', date: new Date('2023-10-27T14:48:00'), items: [{ id: 'm1', name: 'Steak Frites', price: 650.00, quantity: 2, category: 'Main', stock: 1, imageUrl: '' }], total: 1365.00, paymentMethod: 'Card' },
  { id: 'R002', date: new Date('2023-10-27T12:30:00'), items: [{ id: 'b1', name: 'Coke', price: 60.00, quantity: 2, category: 'Bev', stock: 1, imageUrl: '' }], total: 126.00, paymentMethod: 'Cash' },
  { id: 'R001', date: new Date('2023-10-26T19:00:00'), items: [{ id: 'd1', name: 'Cheesecake', price: 220.00, quantity: 1, category: 'Dessert', stock: 1, imageUrl: '' }], total: 231.00, paymentMethod: 'Card' },
];

const ReceiptsScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const filteredReceipts = useMemo(() => {
    return mockReceipts
      .filter(receipt => receipt.id.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [searchTerm]);

  return (
    <div className="p-6 dark:bg-gray-900 min-h-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Receipts</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Receipt ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
        />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedReceipt(receipt)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{receipt.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{receipt.date.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{receipt.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{receipt.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* A simple modal could be implemented here to show receipt details */}
      {selectedReceipt && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedReceipt(null)}>
           <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-gray-800 dark:text-gray-200" onClick={e => e.stopPropagation()}>
             <h2 className="text-2xl font-bold mb-4">Receipt Details: {selectedReceipt.id}</h2>
             <p><strong>Date:</strong> {selectedReceipt.date.toLocaleString()}</p>
             <p><strong>Total:</strong> ₹{selectedReceipt.total.toFixed(2)}</p>
             <p><strong>Payment:</strong> {selectedReceipt.paymentMethod}</p>
             <h3 className="font-bold mt-4 mb-2">Items:</h3>
             <ul>
              {selectedReceipt.items.map(item => (
                <li key={item.id}>{item.quantity}x {item.name}</li>
              ))}
             </ul>
             <button onClick={() => setSelectedReceipt(null)} className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Close</button>
           </div>
         </div>
      )}
    </div>
  );
};

export default ReceiptsScreen;
