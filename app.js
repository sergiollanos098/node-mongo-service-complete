const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const faker = require("faker");

const User = require("./models/user");
const Order = require("./models/order");

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://mongo-db:27017/shopdb")
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// Swagger config
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node.js + MongoDB Microservice",
      version: "1.0.0",
      description: "Microservicio para Users y Orders"
    }
  },
  apis: ["./app.js"]
};
const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: CRUD de usuarios
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
app.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear un usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *     responses:
 *       201:
 *         description: Usuario creado
 */
app.post("/users", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).json(user);
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
app.put("/users/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */
app.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted successfully" });
});

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: CRUD de órdenes
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
  const orders = await Order.find().populate("userId");
  res.json(orders);
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener una orden por ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       404:
 *         description: Orden no encontrada
 */
app.get("/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("userId");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear una orden
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               product: { type: string }
 *               amount: { type: number }
 *     responses:
 *       201:
 *         description: Orden creada
 */
app.post("/orders", async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.status(201).json(order);
});

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Actualizar una orden
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product: { type: string }
 *               amount: { type: number }
 *     responses:
 *       200:
 *         description: Orden actualizada
 *       404:
 *         description: Orden no encontrada
 */
app.put("/orders/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  }).populate("userId");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orden eliminada
 *       404:
 *         description: Orden no encontrada
 */
app.delete("/orders/:id", async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ message: "Order deleted successfully" });
});

/**
 * @swagger
 * /seed:
 *   post:
 *     summary: Insertar datos falsos
 *     tags: [Users, Orders]
 *     responses:
 *       200:
 *         description: Datos de prueba generados
 */
app.post("/seed", async (req, res) => {
  for (let i = 0; i < 5; i++) {
    const user = new User({
      username: faker.internet.userName(),
      email: faker.internet.email()
    });
    await user.save();

    const order = new Order({
      userId: user._id,
      product: faker.commerce.productName(),
      amount: faker.commerce.price()
    });
    await order.save();
  }
  res.json({ message: "Datos falsos insertados" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Node service corriendo en puerto ${PORT}`));
