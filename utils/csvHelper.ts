
import { Item } from '../types';

/**
 * Parses a single CSV line, handling quoted fields correctly.
 */
const parseCSVLine = (text: string): string[] => {
    // Simple split if no quotes are present (optimization)
    if (text.indexOf('"') === -1) return text.split(',');

    const result: string[] = [];
    let current = '';
    let inQuote = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            // Check for escaped quotes (double quotes)
            if (inQuote && text[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    // Clean up results
    return result.map(v => v.trim());
};

export const parseCsvToItems = (csvContent: string): { items: Item[] } => {
    const lines = csvContent.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) {
        return { items: [] };
    }

    const headerLine = lines.shift()!.trim();
    const headers = parseCSVLine(headerLine);
    
    const handleIndex = headers.indexOf('Handle');
    const nameIndex = headers.indexOf('Name');
    const priceIndex = headers.indexOf('Price [AYSHAS]');
    const trackStockIndex = headers.indexOf('Track stock');
    const inStockIndex = headers.indexOf('In stock [AYSHAS]');
    const imageIndex = headers.indexOf('Image Src'); 

    if ([handleIndex, nameIndex, priceIndex].some(i => i === -1)) {
        throw new Error('CSV file is missing required columns: Handle, Name, Price [AYSHAS]');
    }

    const items: Item[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const values = parseCSVLine(line);
        
        if (values.length < 3) continue;

        const priceStr = values[priceIndex];
        const price = (priceStr && priceStr.toLowerCase() !== 'variable' && !isNaN(parseFloat(priceStr))) ? parseFloat(priceStr) : 0;
        
        const trackStock = values[trackStockIndex] === 'Y';
        const stockStr = values[inStockIndex];
        let stock = 0;
        if (!trackStock) {
            stock = 9999;
        } else if (stockStr && !isNaN(parseInt(stockStr))) {
            stock = parseInt(stockStr);
        }

        // Retrieve Image Base64 if available in the imported file
        let imageUrl = '';
        if (imageIndex !== -1 && values[imageIndex]) {
            imageUrl = values[imageIndex];
        } else {
            imageUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(values[nameIndex] || 'Item')}`;
        }

        const item: Item = {
            id: values[handleIndex] || `I${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
            name: values[nameIndex] || 'Unnamed Item',
            price: price,
            stock: stock,
            imageUrl: imageUrl,
            category: '' 
        };

        if (item.name) {
            items.push(item);
        }
    }

    return { items };
}

export const exportItemsToCsv = (items: Item[]): string => {
    // Removed 'Image Src' from the headers
    const headers = [
        'Handle','SKU','Name','Description','Sold by weight','Option 1 name','Option 1 value','Option 2 name','Option 2 value','Option 3 name','Option 3 value','Cost','Barcode','SKU of included item','Quantity of included item','Track stock','Available for sale [AYSHAS]','Price [AYSHAS]','In stock [AYSHAS]','Low stock [AYSHAS]'
    ];
    
    // Function to safely create CSV field (handles commas/quotes by quoting)
    const csvField = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = items.map(item => {
        const row = new Array(headers.length).fill('');
        row[headers.indexOf('Handle')] = item.id;
        row[headers.indexOf('SKU')] = item.id; 
        row[headers.indexOf('Name')] = csvField(item.name);
        row[headers.indexOf('Sold by weight')] = 'N';
        row[headers.indexOf('Track stock')] = 'Y'; 
        row[headers.indexOf('Available for sale [AYSHAS]')] = 'Y';
        row[headers.indexOf('Price [AYSHAS]')] = item.price.toFixed(2);
        row[headers.indexOf('In stock [AYSHAS]')] = item.stock; 
        return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}
