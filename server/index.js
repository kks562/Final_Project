const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const CartItem = require('./models/CartItem');
app.use(cors());
require('dotenv').config();

app.use(express.json());

mongoose.connect('mongodb+srv://root1:root1@cluster0.3xlkp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            email: req.body.email,
            password: hashedPassword
        });
        const savedUser = await user.save();
        res.json(savedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

    const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN);
    res.json({ accessToken, email: user.email, password: req.body.password });
});

// Serve the JSON data
app.get('/perfumes', (req, res) => {
    res.sendFile(path.join(__dirname, 'perfumes.json'));
});

    app.post('/cart',(req,res)=>{
        const {image,name,price}=req.body;
        const newCartItem = new CartItem({
            image: image,
            name: name,
            price: price
        });
    
        newCartItem.save()
        .then(savedItem => {
            console.log('Item saved:', savedItem);
            res.status(201).json({ message: 'Product added to cart successfully!', item: savedItem });
        })
        .catch(error => {
            console.error('Error saving item:', error);
            res.status(500).json({ message: 'Error adding product to cart' });
        });
    });
        
    app.get('/read', (req, res) => {
        CartItem.find({})
            .then(items => {
                res.json(items); 
            })
            .catch(error => {
                console.error('Error retrieving items:', error);
                res.status(500).json({ message: 'Error retrieving cart items' });
            });
    });


    app.delete('/cart/:id', (req, res) => {
        const { id } = req.params;
        CartItem.findByIdAndDelete(id)
            .then(deletedItem => {
                if (!deletedItem) {
                    return res.status(404).json({ message: 'Item not found' });
                }
                res.json({ message: 'Item deleted successfully' });
            })
            .catch(error => {
                console.error('Error deleting item:', error);
                res.status(500).json({ message: 'Error deleting item' });
            });
    });
    
    
app.listen(3000, () => {
    console.log('Server running on port 3000');
});