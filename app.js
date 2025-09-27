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
 * USERS CRUD
 */
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.post("/users", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

app.put("/users/:id", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted successfully" });
});

/**
 * ORDERS CRUD
 */
app.get("/orders", async (req, res) => {
  const orders = await Order.find().populate("userId");
  res.json(orders);
});

app.get("/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("userId");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

app.post("/orders", async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.json(order);
});

app.put("/orders/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  }).populate("userId");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

app.delete("/orders/:id", async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ message: "Order deleted successfully" });
});

// Endpoint para generar datos falsos
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
