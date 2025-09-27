import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { faker } from "@faker-js/faker";

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// ---------------- DB ----------------
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo-db:27017/shopdb";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error conectando Mongo:", err));

// ---------------- MODELS ----------------
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  stock: Number
});

const orderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: Number,
  total: Number,
  date: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

// ---------------- SWAGGER ----------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node + Mongo Microservice API",
      version: "1.0.0",
      description: "API para gestionar productos y órdenes"
    },
    servers: [
      { url: "http://localhost:3000" } // 🔥 Cambia a ALB DNS en AWS
    ],
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/apidocs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------- PRODUCTS CRUD ----------------
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 */
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 */
app.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               stock: { type: number }
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
app.post("/products", async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json({ message: "Product created", product });
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               stock: { type: number }
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: Producto no encontrado
 */
app.put("/products/:id", async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product updated", product });
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       404:
 *         description: Producto no encontrado
 */
app.delete("/products/:id", async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ message: "Product deleted" });
});

// ---------------- ORDERS CRUD ----------------
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de órdenes
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Obtener todas las órdenes
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Lista de órdenes
 */
app.get("/orders", async (req, res) => {
  const orders = await Order.find().populate("productId");
  res.json(orders);
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear una nueva orden
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: number }
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 */
app.post("/orders", async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const total = product.price * quantity;
  const order = new Order({ productId, quantity, total });
  await order.save();

  res.status(201).json({ message: "Order created", order });
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Eliminar una orden
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Orden eliminada
 *       404:
 *         description: Orden no encontrada
 */
app.delete("/orders/:id", async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ message: "Order deleted" });
});

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

