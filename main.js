import express from "express"; //웹 서버 구축하는데 사용
import mongoose from "mongoose"; // mongoDB와 연결하여 데이터를 쉽게 다룰 수 있도록 도와줌
import Task from "./task.js"; // mongoDB에서 사용할 tasks컬렉션과 그 스키마를 다룸
import { DATABASE_URL, PORT } from "./env.js"; //환경 변수로 데이터베이스 연결 url, 포트 번호 가져옴
import data from "./seedData.js"; //seedData에서 불러온 샘플 데이터를 가져옴

const app = express(); // express 애플리케이션을 생성
app.use(express.json()); // 클라이언트에서 보내는 JSON 형식의 데이터를 자동으로 파싱해서 req.body에 저장할 수 있도록 설정

await mongoose.connect(DATABASE_URL); // mongoDB에 연결함 이후 쿼리나 데이터 작업을 망고 DB에서 수행할 수 있다.

app.post("/tasks", async (req, res) => {
  //tasks 경로로 POST 요청을 보냄
  try {
    const data = req.body; // 클라이언트에서 보내온 JSON 데이터를 가져옴
    const newTask = await Task.create(data); // MongoDB에 새로운 task를 추가함
    res.status(201).send(newTask); // 생성된 task를 클라이언트에 응답으로 보내고, HTTP 상태 코드 201 반환
  } catch (e) {
    if (e.name === "ValidationError") {
      res.status(400).send({ message: e.message });
    }
  }
});

app.get("/tasks", async (req, res) => {
  const count = Number(req.query.count) || 0;
  const sortOption =
    req.query.sort === "oldest" ? ["createdAt", "asc"] : ["createdAt", "desc"];
  const tasks = await Task.find().limit(count).sort([sortOption]);
  res.send(tasks);
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task) {
      res.send(task);
    } else {
      res.status(404).send({ message: "Cannot find given id" });
    }
  } catch (e) {
    if (e.name === "CastError") {
      res.status(404).send({ message: "Cannot find given id" });
    } else {
      res.status(500).send({ message: e.message });
    }
  }
});

app.patch("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (task) {
      Object.keys(data).forEach((key) => {
        task[key] = data[key];
      });
      await task.save();
      res.send(task);
    } else {
      res.status(404).send({ message: "Cannot find given id" });
    }
  } catch (e) {
    if (e.name === "CastError") {
      res.status(404).send({ message: "Cannot find given id" });
    } else {
      res.status(500).send({ message: e.message }); // 서버 에러
    }
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (task) {
      res.sendStatus(200);
    } else {
      res.status(404).send({ message: "Cannot find given id" });
    }
  } catch (e) {
    if (e.name === "CastError") {
      res.status(404).send({ message: "Cannot find given id" });
    } else {
      res.status(500).send({ message: e.message }); // 서버 에러
    }
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
