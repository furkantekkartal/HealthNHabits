const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products (with search & category filter)
router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};

        if (search) {
            query.$text = { $search: search };
        }
        if (category && category !== 'All') {
            query.category = category;
        }

        const products = await Product.find(query).sort({ usageCount: -1, sortOrder: 1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get most used products
router.get('/most-used', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const products = await Product.getMostUsed(limit);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Increment usage count (called when adding to log)
router.post('/:id/use', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $inc: { usageCount: 1 } },
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update sort order
router.post('/reorder', async (req, res) => {
    try {
        const { productIds } = req.body; // Array of product IDs in new order
        const updates = productIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { sortOrder: index }
            }
        }));
        await Product.bulkWrite(updates);
        res.json({ message: 'Order updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
