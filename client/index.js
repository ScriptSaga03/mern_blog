const app = {
  // CONFIGRATION & STATE
  config: {
    baseUrl: "http://localhost:8000/api/v1/auth",
  },

  state: {
    currentUser: null,
    isAuthenticated: false,
    usersList: [],
    statusTimer: null,
  },

  // DOM ELEMENTS CACHE
  elements: {
    loginForm: document.getElementById("loginForm"),
  },

  //   APP INITIALIZATION METHOD
  init() {
    this.bindEvents();
  },

  //   Bind Events
  bindEvents() {
    if (this.elements.loginForm) {
      this.elements.loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
      });
    }
  },


//   API REQUEST METHOD
  async apiRequest(endPoint, method = "GET", bodyData = null) {
    // request setup
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (bodyData) {
      options.body = JSON.stringify(bodyData);
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}${endPoint}`,
        options,
      );
      const result = await response.json();
      if (!response.ok) {
        const errorMessage =
          result.message || result.error || result.msg || "Validation Failed!";
        throw new Error(errorMessage);
      }
      return result;
    } catch (error) {
      throw error;
    }
  },
};

// 🚀 START APPLICATION WHEN DOM IS READY
document.addEventListener("DOMContentLoaded", () => {
  AuthApp.init();
});
