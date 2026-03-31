// test_gitguard.js
function calculateTotal(price, tax) {
  console.log("Input price:", price); // Line 3
  var total = price * (1 + tax);
  debugger; // Line 5
  return total;
}

console.log("Result:", calculateTotal(100, 0.2)); // Line 8
