import express from "express";
import router from "./routes/index"
import appConfig from "./appConfig";
import { startConsumer } from "./queue/consumer";

const app = express();
app.use(express.json());

startConsumer().catch(console.error);

app.use("/api", router);

const PORT = appConfig.port;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));