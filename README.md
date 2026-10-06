# Universal Binary Converter v2

A browser-based **Universal Binary Converter and Base Calculator** for performing exact arithmetic with **Binary, Octal, and Hexadecimal** numbers, including fractional values.

## 🌐 Live Demo

**Try it online:**
https://prottoynishan11.github.io/Universal-Binary-Converter-v2/

## ✨ Features

* Exact **Binary arithmetic** with fractional values
* Exact **Octal arithmetic** with fractional values
* Exact **Hexadecimal arithmetic** with fractional values
* Supports:

  * Addition `+`
  * Subtraction `-`
  * Multiplication `*`
  * Division `/`
* Parentheses and operator precedence
* Unary negative numbers
* Cross-base result display
* Improved Hexadecimal parsing
* Exact number conversion without relying on unsafe `parseInt()` or floating-point conversion in the core conversion path

## 🧮 Example Expressions

### Binary

```text
110110101.101001 + 11010010.01010
```

### Octal

```text
2734.3421 + 23452.562
```

### Hexadecimal

```text
12A34BD345F.DFC + 2313DFCA.ACBDFE
```

## 🔧 What Was Fixed in v2?

The previous version had an issue with large hexadecimal values.

Some values were processed through JavaScript `Number` and `parseInt()` conversion paths. Because JavaScript's standard `Number` type cannot represent every large integer exactly, large hexadecimal values could lose digits during conversion.

Version 2 solves this by:

* Parsing base digits using `BigInt`
* Representing fractional values as exact rational numbers
* Avoiding floating-point conversion in the core number-conversion process

This allows calculations involving large Binary, Octal, and Hexadecimal values to remain exact.

## 🚀 Run Locally

This project is a static HTML/CSS/JavaScript application with **no build step and no external dependencies**.

### Using VS Code

1. Clone or download the repository.
2. Open the project folder in VS Code.
3. Open `index.html` in your browser.

You can also use the **Live Server** extension in VS Code, although it is optional.

## 🌐 Deploy as a Website

Because this is a static HTML/CSS/JavaScript project, it can be deployed to services such as:

* GitHub Pages
* Netlify
* Vercel
* Cloudflare Pages
* Other static hosting services

For GitHub Pages, simply enable Pages for the repository and select the branch/folder containing `index.html`.

## 🛠️ Technologies

* HTML
* CSS
* JavaScript
* `BigInt` for exact integer calculations
* Exact rational-number handling for fractional values

## 📁 Project Type

This is a client-side browser application. No server or database is required.

## 📌 Version

**Universal Binary Converter v2**
