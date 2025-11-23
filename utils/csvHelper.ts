
import { Item } from '../types';

export const parseCsvToItems = (csvContent: string): { items: Item[] } => {
    const lines = csvContent.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) {
        return { items: [] };
    }

    const headerLine = lines.shift()!.trim();
    const headers = headerLine.split(',');
    
    const handleIndex = headers.indexOf('Handle');
    const nameIndex = headers.indexOf('Name');
    const priceIndex = headers.indexOf('Price [AYSHAS]');
    const trackStockIndex = headers.indexOf('Track stock');
    const inStockIndex = headers.indexOf('In stock [AYSHAS]');

    if ([handleIndex, nameIndex, priceIndex].some(i => i === -1)) {
        throw new Error('CSV file is missing required columns: Handle, Name, Price [AYSHAS]');
    }

    const items: Item[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const values = line.trim().split(',');
        
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

        const item: Item = {
            id: values[handleIndex],
            name: values[nameIndex] || 'Unnamed Item',
            price: price,
            stock: stock,
            imageUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(values[nameIndex] || 'Item')}`
        };

        if (item.id && item.name) {
            items.push(item);
        }
    }

    return { items };
}

export const exportItemsToCsv = (items: Item[]): string => {
    const headers = [
        'Handle','SKU','Name','Description','Sold by weight','Option 1 name','Option 1 value','Option 2 name','Option 2 value','Option 3 name','Option 3 value','Cost','Barcode','SKU of included item','Quantity of included item','Track stock','Available for sale [AYSHAS]','Price [AYSHAS]','In stock [AYSHAS]','Low stock [AYSHAS]'
    ];
    
    const rows = items.map(item => {
        // Function to safely create CSV field (handles commas by quoting)
        const csvField = (val: string) => `"${val.replace(/"/g, '""')}"`;

        const row = new Array(headers.length).fill('');
        row[headers.indexOf('Handle')] = item.id;
        row[headers.indexOf('SKU')] = item.id; // Using Handle as SKU as well
        row[headers.indexOf('Name')] = csvField(item.name);
        row[headers.indexOf('Sold by weight')] = 'N';
        row[headers.indexOf('Track stock')] = 'N'; // Assuming no stock tracking for simplicity
        row[headers.indexOf('Available for sale [AYSHAS]')] = 'Y';
        row[headers.indexOf('Price [AYSHAS]')] = item.price.toFixed(2);
        row[headers.indexOf('In stock [AYSHAS]')] = ''; // Leave blank as we don't track
        return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}