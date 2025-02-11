import express from "express"; //웹 서버 구축하는데 사용
import mongoose from "mongoose"; // mongoDB와 연결하여 데이터를 쉽게 다룰 수 있도록 도와줌
import Task from "./task.js"; // mongoDB에서 사용할 tasks컬렉션과 그 스키마를 다룸
import { DATABASE_URL, PORT } from "./env.js"; //환경 변수로 데이터베이스 연결 url, 포트 번호 가져옴
import data from "./seedData.js"; //seedData에서 불러온 샘플 데이터를 가져옴

const app = express(); // express 애플리케이션을 생성
app.use(express.json()); // 클라이언트에서 보내는 JSON 형식의 데이터를 자동으로 파싱해서 req.body에 저장할 수 있도록 설정

await mongoose.connect(DATABASE_URL); // mongoDB에 연결함 이후 쿼리나 데이터 작업을 망고 DB에서 수행할 수 있다.

function asyncHandler(handler) {
  // 비동기 함수를 실행하는 wrapper함수
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      if (e.name === "CastError") {
        // 잘못된 형식의 id가 전달 되었을 때
        res.status(404).send({ message: "Cannot find given id" });
      } else if (e.name === "ValidationError") {
        // 데이터 검증 오류 발생했을 때 400 코드와 함께 오류 메시지를 보냄
        res.status(400).send({ message: e.message });
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  };
}

// 새로운 Task 추가
app.post(
  "/tasks",
  asyncHandler(async (req, res) => {
    //tasks 경로로 POST 요청을 보냄
    const data = req.body; // 클라이언트에서 보내온 JSON 데이터를 가져옴
    const newTask = await Task.create(data); // MongoDB에 새로운 task를 추가함
    res.status(201).send(newTask); // 생성된 task를 클라이언트에 응답으로 보내고, HTTP 상태 코드 201 반환
  })
);

// 조회
app.get(
  "/tasks",
  asyncHandler(async (req, res) => {
    const count = Number(req.query.count) || 0; // 쿼리 파라미터로 전달된 count 값 가져오기
    const sortOption =
      req.query.sort === "oldest" // 퀴리 파라미터로 sort가 "oldest"일 경우
        ? ["createdAt", "asc"] // 오름차순으로 정렬
        : ["createdAt", "desc"]; // 그렇지 않으면 내림차순으로 정렬
    const tasks = await Task.find().limit(count).sort([sortOption]); //mongoDB에서 tasks를 가져옴
    res.send(tasks); // 조회한 tasks 목록을 클라이언트에 응답으로 보냄
  })
);

app.get(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id); // :id로 전달된 ID를 통해 task를 조회
    if (task) {
      res.send(task); //task가 있으면 해당 task를 클라이언트에 응답으로 보냄
    } else {
      res.status(404).send({ message: "Cannot find given id" });
    }
  })
);

app.patch(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id); //:id로 전달된 ID를 통해 task를 조회
    if (task) {
      Object.keys(data).forEach((key) => {
        task[key] = data[key]; //data 객체의 키들을 통해 task를 수정
      });
      await task.save();
      res.send(task);
    } else {
      res.status(404).send({ message: "Cannot find given id" });
    }
  })
);

app.delete(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (task) {
      res.sendStatus(200);
    } else {
      res.status(404).send({ message: "Cannot find given id" });
    }
  })
);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
