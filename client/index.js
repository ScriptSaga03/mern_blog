const blogApp = {
  config: {
    url: `http://localhost:8000`,
  },

  // STATE
  state: {
    statusTimer: null,
  },

  //  TARGET ELEMENTS
  elements: {
    loginForm: null,
    registerForm: null,
    userNameInput: null,
    userNameInput: null,
    userEmailInput: null,
    userPassInput: null,
    respMessage: null,
  },

  // INIT FUNCTION
  init() {
    this.cacheElements();
    this.bindEvents();
  },

  // CACHE ELEMENTS
  cacheElements() {
    this.elements.loginForm = document.getElementById("loginForm");
    this.elements.registerForm = document.getElementById("registerForm");
    this.elements.userNameInput = document.getElementById("name");
    this.elements.userEmailInput = document.getElementById("email");
    this.elements.userPassInput = document.getElementById("password");
    this.elements.respMessage = document.getElementById("respMsg");
  },
  // BIND EVENTS
  bindEvents() {
    const { loginForm, registerForm } = this.elements;
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // register

    if (registerForm) {
      registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        this.handleRegister();
      });
    }
  },

  // SHOW STATUS
  showStatus(msg, color) {
    if (this.state.statusTimer) clearTimeout(this.state.statusTimer);
    const { respMessage } = this.elements;
    respMessage.textContent = msg;
    respMessage.style.color = color;
    respMessage.classList.add("show");

    this.state.statusTimer = setTimeout(() => {
      respMessage.textContent = "";
      respMessage.classList.remove("show");
      this.state.statusTimer = null;
    }, 5000);
  },

  // HANDLE LOGIN FORM
  async handleLogin() {
    const email = this.elements.userEmailInput.value.trim();
    const password = this.elements.userPassInput.value;

    // 1. Required fields validation
    if (!email || !password) {
      this.showStatus("Please fill all fields", "red");
      return;
    }
    // 2. Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.showStatus("Please enter a valid email address.", "red");
      return;
    }

    try {
      this.showStatus("Logging in...", "black");

      // 3. Send login request
      const resp = await fetch(`${this.config.url}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // CONVERT JSON RESPONSE INTO A JS OBJ
      const result = await resp.json();

      // HANDLE BACKEND VALIDATION / AUTHENTICATION ERRORS
      if (!resp.ok) {
        const message = result.error?.length
          ? result.errors.map((err) => err.message).join(" ")
          : result.message || "Login failed. Please try again.";

        this.showStatus(message, "red");
        return;
      }

      // 7. Show success
      this.showStatus(result.message || "Login successful!", "green");
      console.log("Logged-in user:", result.data);

    } catch (error) {
      console.log(error);
      // Network errors or invalid JSON response
      console.error("Login error:", error);
      this.showStatus(
        "Unable to connect to the server. Please try again.",
        "red",
      );
    }
  },

  // HANDLE Register FORM

  async handleRegister() {
    const name = this.elements.userNameInput.value.trim();
    const email = this.elements.userEmailInput.value.trim();
    const password = this.elements.userPassInput.value;
  

    // 1. Required fields
    if (!name || !email || !password ) {
      this.showStatus("Please fill all fields.", "red");
      return;
    }

    // 2. Name validation: 3–50 letters and spaces
    const namePattern = /^[A-Za-z ]+$/;

    if (name.length < 3 || name.length > 50 || !namePattern.test(name)) {
      this.showStatus(
        "Name must be 3–50 characters and contain only letters and spaces.",
        "red",
      );
      return;
    }

    // 3. Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.showStatus("Please enter a valid email address.", "red");
      return;
    }

    // 4. Password validation (matches backend strength rules)
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

    if (!strongPassword.test(password)) {
      this.showStatus(
        "Password must have 8+ characters, uppercase, lowercase, number and symbol.",
        "red",
      );
      return;
    }



    try {
      this.showStatus("Creating your account...", "black");

      // 6. Send register request
      const response = await fetch(`${this.config.url}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      // 7. Read server response
      const result = await response.json();

      // 8. Handle errors
      if (!response.ok) {
        const message = result.errors?.length
          ? result.errors.map((error) => error.message).join(" ")
          : result.message || "Registration failed.";

        this.showStatus(message, "red");
        return;
      }

      // 9. Success
      this.showStatus(
        result.message || "Account created successfully! Please log in.",
        "green",
      );

      this.elements.registerForm.reset();
      console.log("Registered user:", result.data);

      settimeout(() => {
        window.location.href = "/src/pages/auth/login.html";
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
      this.showStatus(
        "Unable to connect to the server. Please try again.",
        "red",
      );
    }
  },
};

// 🚀 START APPLICATION WHEN DOM IS READY
document.addEventListener("DOMContentLoaded", () => {
  blogApp.init();
});
