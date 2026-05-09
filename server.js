const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 🔹 GET KEYS FROM .env
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

console.log("KEY_ID:", KEY_ID);
console.log("KEY_SECRET:", KEY_SECRET);

// 🔹 Razorpay Instance
const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

// 🔹 FRONTEND + BUTTON
app.get("/", (req, res) => {
  res.send(`
  <html>
    <head>
      <title>Razorpay Payment</title>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>

    <body style="text-align:center; margin-top:100px;">
      <h2>Razorpay Dummy Payment</h2>
      <button id="payBtn" style="padding:10px 20px; font-size:18px;">
        Pay ₹5000
      </button>

      <script>
        document.getElementById("payBtn").onclick = async function () {

          console.log("Button Clicked ✅");

          // 🔹 Create Order
          const res = await fetch("/create-order", { method: "POST" });
          const data = await res.json();

          console.log("Order:", data);

          const options = {
            key: "${KEY_ID}", // 🔥 KEY HERE
            amount: data.order.amount,
            currency: "INR",
            name: "My Project",
            description: "Test Payment",
            order_id: data.order.id,

            handler: async function (response) {

              console.log("Payment Response:", response);

              // 🔹 Verify Payment
              const verifyRes = await fetch("/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(response)
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                alert("✅ Payment Successful & Verified");
              } else {
                alert("❌ Payment Verification Failed");
              }
            },

            theme: {
              color: "#3399cc"
            }
          };

          const rzp = new Razorpay(options);
          rzp.open();
        };
      </script>
    </body>
  </html>
  `);
});

// 🔹 CREATE ORDER API
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 500000, // ₹500
      currency: "INR",
      receipt: "receipt_123",
    });

    res.json({ success: true, order });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// 🔹 VERIFY PAYMENT API
app.post("/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 🔹 START SERVER
app.listen(3001, () => {
  console.log("🚀 Server running at http://localhost:3001");
});