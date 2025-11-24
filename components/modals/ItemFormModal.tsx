
import React, { useState, useEffect, useRef } from 'react';
import { Item } from '../../types';
import { TrashIcon, PencilIcon, CloseIcon } from '../../constants';

interface ItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<Item>) => void;
    onDelete?: () => void;
    initialData?: Item;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('');
    
    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPrice(initialData.price.toString());
            setStock(initialData.stock.toString());
            setImageUrl(initialData.imageUrl);
            setCategory(initialData.category || '');
        } else {
            setName('');
            setPrice('');
            setStock('100');
            setImageUrl('');
            setCategory('');
        }
        setIsProcessing(false);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            price: parseFloat(price) || 0,
            stock: parseInt(stock) || 0,
            imageUrl: imageUrl || '', // Allow empty string
            category: category.trim()
        });
    };

    /**
     * COMPRESS IMAGE FUNCTION
     * Takes a large file, resizes it to max 500px width/height, 
     * and returns a compressed Base64 string (~30KB-50KB).
     * This fits easily into Firestore (1MB limit per doc) and is perfect for <150 items.
     */
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        setIsProcessing(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG at 0.7 quality
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                
                // Safety check for Firestore Limit (1MB)
                if (compressedBase64.length > 900000) {
                    alert("Even after compression, this image is too complex. Please choose a simpler photo.");
                    setIsProcessing(false);
                    return;
                }

                setImageUrl(compressedBase64);
                setIsProcessing(false);
            };
        };
        reader.onerror = () => {
            alert("Failed to read file.");
            setIsProcessing(false);
        };
        
        // Reset input so same file can be selected again if user clears it then re-adds
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageUrl('');
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-6 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-primary">
                        {initialData ? 'Edit Item' : 'Add New Item'}
                    </h2>
                    {initialData && onDelete && (
                         <button 
                            type="button" 
                            onClick={onDelete}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            aria-label="Delete item"
                            title="Delete Item"
                         >
                            <TrashIcon className="h-5 w-5" />
                         </button>
                    )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload Section */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div 
                            onClick={triggerFileSelect}
                            className="relative w-32 h-32 rounded-lg bg-surface-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden group hover:border-primary transition-colors"
                        >
                            {imageUrl ? (
                                <>
                                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    {/* Overlay for editing */}
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PencilIcon className="text-white h-8 w-8" />
                                    </div>
                                    {/* Remove button */}
                                    <button 
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors z-10"
                                        title="Remove Image"
                                    >
                                        <CloseIcon className="h-4 w-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-2">
                                    <span className="text-xs text-text-secondary">Tap to add photo</span>
                                </div>
                            )}
                            
                            {isProcessing && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button type="button" onClick={triggerFileSelect} className="mt-2 text-sm text-primary font-medium hover:underline">
                            {imageUrl ? 'Change Photo' : 'Select from Gallery'}
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Item Name</label>
                        <input 
                            required
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full p-2 border border-border rounded bg-background text-text-primary focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Category (Optional)</label>
                        <input 
                            type="text" 
                            value={category} 
                            onChange={e => setCategory(e.target.value)} 
                            placeholder="e.g. Starters, Drinks"
                            className="w-full p-2 border border-border rounded bg-background text-text-primary focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Price</label>
                            <input 
                                required
                                type="number" 
                                min="0"
                                step="0.01"
                                value={price} 
                                onChange={e => setPrice(e.target.value)} 
                                className="w-full p-2 border border-border rounded bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Stock</label>
                            <input 
                                type="number" 
                                value={stock} 
                                onChange={e => setStock(e.target.value)} 
                                className="w-full p-2 border border-border rounded bg-background text-text-primary focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary hover:bg-surface-muted rounded">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isProcessing}
                            className="px-6 py-2 bg-primary text-primary-content rounded hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : 'Save Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemFormModal;