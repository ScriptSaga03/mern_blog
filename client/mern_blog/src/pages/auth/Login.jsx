import React from "react";
import AuthActionButton from "../../components/Button";

export default function Login() {
  return (
    <div className="bg-white p-6">
      <form>
        <div>
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="enter your email address"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
          />
        </div>
        <AuthActionButton text="Log In"/>
      </form>
    </div>
  );
}
