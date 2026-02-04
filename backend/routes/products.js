const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, ProductVariant } = require('../models');
const { getFileUrl } = require('../config/fileStorage');
const auth = require('../middleware/auth');

// All product routes require authentication
router.use(auth);

// Helper to format product for API response
const formatProduct = (product, req) => {
    const apiFormat = product.toAPIFormat();
    if (apiFormat.imagePath) {
        apiFormat.imageUrl = getFileUrl(req, apiFormat.imagePath);
    }
    return apiFormat;
};

// Get all products (with search & category filter)
// Shows: default products (userId=null) + user's own private products
router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;
        const userId = req.user.userId;

        // Show default products (userId=null) OR user's own products
        const where = {
            [Op.or]: [
                { userId: null },      // Default products visible to all
                { userId: userId }     // User's private products
            ]
        };

        if (search) {
            where.name = { [Op.iLike]: `%${search}%` };
        }
        if (category && category !== 'All') {
            where.category = category;
        }

        const products = await Product.findAll({
            where,
            include: [{ model: ProductVariant, as: 'variants' }],
            order: [
                ['userId', 'ASC NULLS FIRST'], // Default products first
                ['usage_count', 'DESC']         // Then by most used
            ]
        });

        res.json(products.map(p => formatProduct(p, req)));
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get most used products - includes defaults and user's products
router.get('/most-used', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const userId = req.user.userId;
        const products = await Product.getMostUsed(userId, limit);
        res.json(products.map(p => formatProduct(p, req)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product - allows default products or user's own
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const product = await Product.findOne({
            where: {
                id: req.params.id,
                [Op.or]: [
                    { userId: null },  // Default product
                    { userId: userId } // User's own product
                ]
            },
            include: [{ model: ProductVariant, as: 'variants' }]
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(formatProduct(product, req));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        const path = require('path');
        const fs = require('fs');

        const userId = req.user.userId;

        // Flatten nested objects from request
        const productData = {
            userId, // Associate product with user
            name: req.body.name,
            emoji: req.body.emoji,
            category: req.body.category,
            imagePath: req.body.imagePath, // Accept existing imagePath
        };

        // Handle base64 image upload
        if (req.body.imageUrl && req.body.imageUrl.startsWith('data:image')) {
            try {
                const matches = req.body.imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                    const base64Data = matches[2];
                    const filename = `product_${Date.now()}.${ext}`;
                    // User-specific subdirectory for images
                    const productImagesDir = path.join(__dirname, '..', 'uploads', 'product_images', String(userId));

                    // Ensure user directory exists
                    if (!fs.existsSync(productImagesDir)) {
                        fs.mkdirSync(productImagesDir, { recursive: true });
                    }

                    const filePath = path.join(productImagesDir, filename);
                    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                    productData.imagePath = `uploads/product_images/${userId}/${filename}`;
                }
            } catch (imgError) {
                console.error('Error saving product image:', imgError);
            }
        } else if (req.body.imageUrl && !req.body.imageUrl.startsWith('blob:')) {
            // Use imageUrl if it's a valid server path (not a blob URL)
            productData.imagePath = req.body.imageUrl;
        }

        // Handle servingSize
        if (req.body.servingSize) {
            productData.servingSizeValue = req.body.servingSize.value || 100;
            productData.servingSizeUnit = req.body.servingSize.unit || 'g';
        } else {
            productData.servingSizeValue = req.body.servingSizeValue || 100;
            productData.servingSizeUnit = req.body.servingSizeUnit || 'g';
        }

        // Handle nutrition
        if (req.body.nutrition) {
            productData.calories = req.body.nutrition.calories || 0;
            productData.protein = req.body.nutrition.protein || 0;
            productData.carbs = req.body.nutrition.carbs || 0;
            productData.fat = req.body.nutrition.fat || 0;
            productData.fiber = req.body.nutrition.fiber || 0;
            productData.sugar = req.body.nutrition.sugar || 0;
        } else {
            productData.calories = req.body.calories || 0;
            productData.protein = req.body.protein || 0;
            productData.carbs = req.body.carbs || 0;
            productData.fat = req.body.fat || 0;
            productData.fiber = req.body.fiber || 0;
            productData.sugar = req.body.sugar || 0;
        }

        // Handle ingredients (for meals with multiple items)
        if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
            productData.ingredients = req.body.ingredients;
        }

        const product = await Product.create(productData);

        // Handle variants if provided
        if (req.body.variants && Array.isArray(req.body.variants)) {
            for (const variant of req.body.variants) {
                await ProductVariant.create({
                    productId: product.id,
                    name: variant.name,
                    multiplier: variant.multiplier || 1
                });
            }
        }

        // Reload with variants
        await product.reload({
            include: [{ model: ProductVariant, as: 'variants' }]
        });

        res.status(201).json(formatProduct(product, req));
    } catch (error) {
        console.error('Create product error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update product - verify ownership
router.put('/:id', async (req, res) => {
    try {
        const path = require('path');
        const fs = require('fs');
        const userId = req.user.userId;

        const product = await Product.findOne({ where: { id: req.params.id, userId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Build update data
        const updateData = {};

        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.emoji !== undefined) updateData.emoji = req.body.emoji;
        if (req.body.category !== undefined) updateData.category = req.body.category;

        // Handle base64 image upload
        if (req.body.imageUrl && req.body.imageUrl.startsWith('data:image')) {
            try {
                const matches = req.body.imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                    const base64Data = matches[2];
                    const filename = `product_${Date.now()}.${ext}`;
                    // User-specific subdirectory for images
                    const productImagesDir = path.join(__dirname, '..', 'uploads', 'product_images', String(userId));

                    if (!fs.existsSync(productImagesDir)) {
                        fs.mkdirSync(productImagesDir, { recursive: true });
                    }

                    const filePath = path.join(productImagesDir, filename);
                    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                    updateData.imagePath = `uploads/product_images/${userId}/${filename}`;
                }
            } catch (imgError) {
                console.error('Error saving product image:', imgError);
            }
        } else if (req.body.imageUrl && !req.body.imageUrl.startsWith('blob:')) {
            updateData.imagePath = req.body.imageUrl;
        }
        if (req.body.imagePath !== undefined) updateData.imagePath = req.body.imagePath;

        // Handle servingSize
        if (req.body.servingSize) {
            updateData.servingSizeValue = req.body.servingSize.value;
            updateData.servingSizeUnit = req.body.servingSize.unit;
        }

        // Handle nutrition
        if (req.body.nutrition) {
            updateData.calories = req.body.nutrition.calories;
            updateData.protein = req.body.nutrition.protein;
            updateData.carbs = req.body.nutrition.carbs;
            updateData.fat = req.body.nutrition.fat;
            updateData.fiber = req.body.nutrition.fiber;
            updateData.sugar = req.body.nutrition.sugar;
        }

        // Handle ingredients update
        if (req.body.ingredients !== undefined) {
            updateData.ingredients = req.body.ingredients;
        }

        await product.update(updateData);

        // Handle variants update if provided
        if (req.body.variants && Array.isArray(req.body.variants)) {
            // Remove old variants
            await ProductVariant.destroy({ where: { productId: product.id } });
            // Add new variants
            for (const variant of req.body.variants) {
                await ProductVariant.create({
                    productId: product.id,
                    name: variant.name,
                    multiplier: variant.multiplier || 1
                });
            }
        }

        await product.reload({
            include: [{ model: ProductVariant, as: 'variants' }]
        });

        res.json(formatProduct(product, req));
    } catch (error) {
        console.error('Update product error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete product - verify ownership
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const product = await Product.findOne({ where: { id: req.params.id, userId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        await product.destroy();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Increment usage count (called when adding to log) - verify ownership
router.post('/:id/use', async (req, res) => {
    try {
        const userId = req.user.userId;
        const product = await Product.findOne({ where: { id: req.params.id, userId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        await product.increment('usageCount');
        await product.reload();
        res.json(formatProduct(product, req));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update sort order - only for user's own products
router.post('/reorder', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productIds } = req.body; // Array of product IDs in new order

        for (let i = 0; i < productIds.length; i++) {
            await Product.update(
                { sortOrder: i },
                { where: { id: productIds[i], userId } } // Only update user's products
            );
        }

        res.json({ message: 'Order updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
