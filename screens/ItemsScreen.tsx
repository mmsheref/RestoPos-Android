
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Item } from '../types';
import { useAppContext } from '../context/AppContext';
import ItemFormModal from '../components/modals/ItemFormModal';
import { SearchIcon, TrashIcon, CloseIcon, PencilIcon, MenuIcon } from '../constants';
import ConfirmCsvImportModal from '../components/modals/ConfirmCsvImportModal';
import { parseCsvToItems } from '../utils/csvHelper';
import ConfirmModal from '../components/modals/ConfirmModal';


// UUID Generator Fallback for non-secure contexts (e.g. localhost/http)
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Extracted Image Component to prevent re-creation in loop
const ItemImage = React.memo(({ item }: { item: Item }) => {
    const [imgError, setImgError] = useState(false);

    if (item.imageUrl && !imgError) {
        return (
            <img 
                className="h-10 w-10 md:h-12 md:w-12 rounded-md object-cover bg-surface-muted" 
                src={item.imageUrl} 
                alt={item.name} 
                onError={() => setImgError(true)} 
                loading="lazy"
            />
        );
    }

    return (
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-md bg-surface-muted flex items-center justify-center text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
    );
});

// Refactored Row Component
interface ItemRowProps {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

const ItemRow = React.memo<ItemRowProps>(({ item, onEdit, onDelete }) => {
    return (
        <>
            {/* Desktop Table Row */}
            <tr 
                onClick={() => onEdit(item)}
                className="hidden md:table-row hover:bg-surface-muted transition-colors cursor-pointer group"
            >
                <td className="px-6 py-4 whitespace-nowrap">
                    <ItemImage item={item} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{item.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{item.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(item);
                        }} 
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors relative z-10"
                        title="Delete Item"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </td>
            </tr>

            {/* Mobile List Card */}
            <tr className="md:hidden border-b border-border">
                <td colSpan={5} className="p-0">
                    <div 
                        onClick={() => onEdit(item)}
                        className="flex items-center p-4 active:bg-surface-muted cursor-pointer"
                    >
                        <ItemImage item={item} />
                        <div className="ml-4 flex-grow min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
                            <p className="text-xs text-text-muted mt-0.5">{item.stock} in stock</p>
                        </div>
                        <div className="text-right mr-4">
                            <p className="text-sm font-bold text-text-primary">₹{item.price.toFixed(2)}</p>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(item);
                            }} 
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </td>
            </tr>
        </>
    );
});

const ItemsScreen: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, exportItemsCsv, replaceItems, openDrawer } = useAppContext();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  // Pagination State for Performance
  const [displayLimit, setDisplayLimit] = useState(20);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);

  // CSV import state
  const [isCsvImportModalOpen, setIsCsvImportModalOpen] = useState(false);
  const [csvImportCandidate, setCsvImportCandidate] = useState<{items: Item[]}>({ items: [] });
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  
  // Delete confirmation modal state
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean; item: Item | null; }>({ isOpen: false, item: null });

  const filteredItems = useMemo(() => {
      return items.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [items, search]);

  // Reset pagination when search changes
  useEffect(() => {
    setDisplayLimit(20);
  }, [search]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && displayLimit < filteredItems.length) {
                setDisplayLimit(prev => Math.min(prev + 20, filteredItems.length));
            }
        },
        { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredItems.length, displayLimit]);

  const displayedItems = useMemo(() => {
      return filteredItems.slice(0, displayLimit);
  }, [filteredItems, displayLimit]);

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = useCallback((item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((item: Item) => {
    setConfirmDeleteModal({ isOpen: true, item: item });
  }, []);
  
  const handleDeleteItem = (itemId: string) => {
      deleteItem(itemId);
      
      if (editingItem?.id === itemId) {
          setIsModalOpen(false);
          setEditingItem(undefined);
      }
  };
  
  const handleSaveItem = (itemData: Partial<Item>) => {
      if (editingItem) {
          updateItem({ ...editingItem, ...itemData } as Item);
      } else {
          addItem({ 
              id: generateId(), 
              name: itemData.name || 'New Item',
              price: itemData.price || 0,
              stock: itemData.stock || 0,
              imageUrl: itemData.imageUrl || '',
              category: itemData.category || ''
          } as Item);
      }
      setIsModalOpen(false);
  };

  const handleCsvImportClick = () => {
      csvFileInputRef.current?.click();
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
            const csvContent = event.target?.result as string;
            if (csvContent) {
               const parsedData = parseCsvToItems(csvContent);
               if (parsedData.items.length === 0) {
                   throw new Error("No valid items found in the CSV file.");
               }
               setCsvImportCandidate(parsedData);
               setIsCsvImportModalOpen(true);
            }
          } catch (error: any) {
              console.error(error);
              alert(`Failed to parse CSV file: ${error.message}`);
          } finally {
             if (csvFileInputRef.current) csvFileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleConfirmCsvImport = () => {
      if (csvImportCandidate.items.length > 0) {
          replaceItems(csvImportCandidate.items);
          setIsCsvImportModalOpen(false);
          setCsvImportCandidate({ items: [] });
          alert("Items imported successfully!");
      }
  };

  return (
    <div className="bg-background h-full flex flex-col min-h-0 pt-safe-top">
      <div className="p-4 md:p-6 flex flex-col flex-grow min-h-0 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
            <div className="flex items-center self-start md:self-center w-full md:w-auto">
                <button onClick={openDrawer} className="p-2 -ml-2 mr-2 text-text-secondary hover:text-text-primary">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Menu Items</h1>
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-2">
                <div className="relative flex-grow md:flex-grow-0">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-5 w-5" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-10 py-2 border rounded-lg w-full md:w-64 bg-surface border-border text-text-primary focus:ring-2 focus:ring-primary"
                    />
                    {search && (
                        <button 
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                            aria-label="Clear search"
                        >
                            <CloseIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={handleCsvImportClick}
                        className="bg-teal-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
                        title="Import CSV"
                    >
                        Import
                    </button>
                    <button
                        onClick={exportItemsCsv}
                        className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        title="Export CSV"
                    >
                        Export
                    </button>
                </div>
                
                <button
                onClick={handleAddItem}
                className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex-shrink-0 whitespace-nowrap"
                >
                + Add
                </button>
            </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm flex-grow border border-border overflow-auto min-h-0">
            <table className="min-w-full divide-y divide-border relative">
            <thead className="bg-surface-muted sticky top-0 z-20 shadow-sm hidden md:table-header-group">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Image</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Stock</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
                {filteredItems.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                            {search ? 'No items found matching your search.' : 'No items available. Add your first item!'}
                        </td>
                    </tr>
                ) : (
                    <>
                    {displayedItems.map((item) => (
                        <ItemRow 
                            key={item.id} 
                            item={item} 
                            onEdit={handleEditItem} 
                            onDelete={handleDeleteRequest} 
                        />
                    ))}
                    {/* Sentinel Row for Infinite Scroll */}
                    {displayLimit < filteredItems.length && (
                        <tr ref={loadMoreRef} className="bg-surface-muted/30">
                            <td colSpan={5} className="py-4 text-center text-sm text-text-muted">
                                Loading more items...
                            </td>
                        </tr>
                    )}
                    </>
                )}
            </tbody>
            </table>
        </div>
      </div>

      <ItemFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={() => {
            if(editingItem) handleDeleteRequest(editingItem);
        }}
        initialData={editingItem}
      />

      <input 
        type="file" 
        accept=".csv, text/csv"
        ref={csvFileInputRef} 
        onChange={handleCsvFileChange} 
        className="hidden" 
      />

      <ConfirmCsvImportModal
        isOpen={isCsvImportModalOpen}
        items={csvImportCandidate.items}
        onClose={() => setIsCsvImportModalOpen(false)}
        onConfirm={handleConfirmCsvImport}
      />
      
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, item: null })}
        onConfirm={() => {
            if (confirmDeleteModal.item) {
                handleDeleteItem(confirmDeleteModal.item.id);
            }
            setConfirmDeleteModal({ isOpen: false, item: null });
        }}
        title="Delete Item"
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      >
        <p>Are you sure you want to permanently delete <strong>{confirmDeleteModal.item?.name}</strong>?</p>
      </ConfirmModal>

    </div>
  );
};

export default ItemsScreen;
