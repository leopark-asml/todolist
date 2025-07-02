import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAPUj8U7_RFdjMlwvdqSYbYPV-MsbSx8-U",
  authDomain: "src-todolist.firebaseapp.com",
  projectId: "src-todolist",
  storageBucket: "src-todolist.firebasestorage.app",
  messagingSenderId: "141706123147",
  appId: "1:141706123147:web:7825e62d783514d576c18e",
  measurementId: "G-QJMGNJ2YNN"
};
// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM 요소
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');
const todoForm = document.getElementById('todo-form');
const todoList = document.getElementById('todo-list');
const adminSection = document.getElementById('admin-section');
const allTodosList = document.getElementById('all-todos');

// 인증 상태 변경 감지
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();

    if (!userData.approved) {
      alert('관리자의 승인이 필요합니다.');
      await signOut(auth);
      return;
    }

    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';

    if (userData.isAdmin) {
      showAdminFeatures();
    } else {
      showUserFeatures();
    }

    loadUserTodos(user.uid);
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
  }
});

// 로그인
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginForm['login-email'].value;
  const password = loginForm['login-password'].value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert('로그인 실패: ' + err.message);
  }
});

// 회원가입
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = signupForm['register-email'].value;
  const password = signupForm['register-password'].value;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      approved: false,
      isAdmin: false
    });
    alert('회원가입 완료! 관리자의 승인을 기다려주세요.');
  } catch (err) {
    alert('회원가입 실패: ' + err.message);
  }
});

// 로그아웃
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

// TODO 추가
todoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = todoForm['todo-input'].value;
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, 'todos'), {
    uid: user.uid,
    content,
    completed: false,
    createdAt: new Date()
  });

  todoForm.reset();
  alert('TODO가 추가되었습니다.');
});

// 사용자 TODO 불러오기
function loadUserTodos(uid) {
  const q = collection(db, 'todos');
  onSnapshot(q, (snapshot) => {
    todoList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const todo = docSnap.data();
      if (todo.uid === uid) {
        renderTodoItem(docSnap.id, todo, todoList);
      }
    });
  });
}

// 관리자: 전체 TODO 보기
function loadAllTodos() {
  const q = collection(db, 'todos');
  onSnapshot(q, (snapshot) => {
    allTodosList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const todo = docSnap.data();
      renderTodoItem(docSnap.id, todo, allTodosList, true);
    });
  });
}

function showAdminFeatures() {
  adminSection.style.display = 'block';
  loadAllTodos();
}

function showUserFeatures() {
  adminSection.style.display = 'none';
}

// TODO 렌더링
function renderTodoItem(id, todo, container, isAdmin = false) {
  const div = document.createElement('div');
  div.className = 'todo-item' + (todo.completed ? ' completed' : '');
  div.innerHTML = `
    <span>${todo.content}</span>
    <button onclick="deleteTodo('${id}')">Delete</button>
  `;
  container.appendChild(div);
}

// TODO 삭제 기능 추가
async function deleteTodo(id) {
  await deleteDoc(doc(db, 'todos', id));
  alert('TODO가 삭제되었습니다.');
}