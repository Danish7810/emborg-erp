const fs = require('fs');
const path = require('path');

// ── LOGIN PAGE ─────────────────────────────────────────────────────
const loginPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'auth', 'login', 'page.tsx');
let login = fs.readFileSync(loginPath, { encoding: 'utf8' });

// Add autoComplete to email input
login = login.replace(
  `type="email" placeholder="Email address"`,
  `type="email" placeholder="Email address" autoComplete="username"`
);

// Add autoComplete to password input
login = login.replace(
  `type="password" placeholder="Password"`,
  `type="password" placeholder="Password" autoComplete="current-password"`
);

// Add autoComplete="off" to the form itself
login = login.replace(
  `<form onSubmit={handleLogin}`,
  `<form onSubmit={handleLogin} autoComplete="off"`
);

fs.writeFileSync(loginPath, login, { encoding: 'utf8' });
console.log('✅ Login form: autoComplete fixed');

// ── SIGNUP PAGE ────────────────────────────────────────────────────
const signupPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'auth', 'signup', 'page.tsx');
let signup = fs.readFileSync(signupPath, { encoding: 'utf8' });

// Add autoComplete to each field
signup = signup.replace(
  `type="text" placeholder="Your full name"`,
  `type="text" placeholder="Your full name" autoComplete="off"`
);
signup = signup.replace(
  `type="text" placeholder="Company name"`,
  `type="text" placeholder="Company name" autoComplete="organization"`
);
signup = signup.replace(
  `type="email" placeholder="Email address"`,
  `type="email" placeholder="Email address" autoComplete="off"`
);
signup = signup.replace(
  `type="password" placeholder="Password (min 6 characters)"`,
  `type="password" placeholder="Password (min 6 characters)" autoComplete="new-password"`
);

// Add autoComplete="off" to the form
signup = signup.replace(
  `<form onSubmit={handleSignup}`,
  `<form onSubmit={handleSignup} autoComplete="off"`
);

// Also fix the bug: password field has backgroundColor: "var(--ink)" (black on black!)
signup = signup.replace(
  `backgroundColor: "var(--ink)", color: "var(--ink)", fontSize: "14px" }} />`,
  `backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />`
);

fs.writeFileSync(signupPath, signup, { encoding: 'utf8' });
console.log('✅ Signup form: autoComplete fixed');
console.log('✅ Signup bonus fix: password field background was var(--ink) — now var(--bg) (was invisible text on dark bg)');

console.log('\nRun: npm run build');
