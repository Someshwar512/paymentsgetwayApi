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


// 🔹 Razorpay Instance
const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

// 🔹 FRONTEND + BUTTON
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">

  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

    <title>Premium Payment</title>

    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <style>

      *{
        margin:0;
        padding:0;
        box-sizing:border-box;
        font-family:'Poppins',sans-serif;
      }

      body{
        height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        background:linear-gradient(135deg,#0f172a,#1e293b,#0f172a);
        overflow:hidden;
      }

      .bg-animation{
        position:absolute;
        width:600px;
        height:600px;
        background:#38bdf8;
        filter:blur(150px);
        opacity:.2;
        border-radius:50%;
        animation:move 8s infinite alternate;
      }

      @keyframes move{
        from{
          transform:translate(-150px,-100px);
        }
        to{
          transform:translate(150px,100px);
        }
      }

      .card{
        position:relative;
        width:380px;
        padding:40px 30px;
        border-radius:30px;
        background:rgba(255,255,255,0.08);
        backdrop-filter:blur(18px);
        border:1px solid rgba(255,255,255,0.1);
        box-shadow:0 20px 60px rgba(0,0,0,.4);
        text-align:center;
        color:white;
        animation:fadeUp 1s ease;
      }

      @keyframes fadeUp{
        from{
          opacity:0;
          transform:translateY(50px);
        }
        to{
          opacity:1;
          transform:translateY(0);
        }
      }

      .logo{
        width:80px;
        height:80px;
        border-radius:20px;
        margin:auto;
        margin-bottom:20px;
        background:linear-gradient(135deg,#38bdf8,#0ea5e9);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:30px;
        font-weight:700;
      }

      h1{
        font-size:28px;
        margin-bottom:10px;
      }

      p{
        color:#cbd5e1;
        font-size:15px;
        margin-bottom:30px;
      }

      .price{
        font-size:50px;
        font-weight:700;
        margin-bottom:30px;
        color:#38bdf8;
      }

      .features{
        text-align:left;
        margin-bottom:35px;
      }

      .features div{
        margin:12px 0;
        color:#e2e8f0;
        font-size:15px;
      }

      button{
        width:100%;
        padding:16px;
        border:none;
        border-radius:14px;
        background:linear-gradient(135deg,#38bdf8,#0ea5e9);
        color:white;
        font-size:18px;
        font-weight:600;
        cursor:pointer;
        transition:.3s;
      }

      button:hover{
        transform:translateY(-3px) scale(1.02);
        box-shadow:0 10px 25px rgba(56,189,248,.4);
      }

      .secure{
        margin-top:18px;
        font-size:13px;
        color:#94a3b8;
      }

    </style>
  </head>

  <body>

    <div class="bg-animation"></div>

    <div class="card">

      <div class="logo">M</div>

      <h1>Premium Plan</h1>

      <p>Secure payment powered by Razorpay</p>

      <div class="price">₹5000</div>

      <div class="features">
        <div>✔ Full Stack Website</div>
        <div>✔ Payment Gateway Integration</div>
        <div>✔ Admin Dashboard</div>
        <div>✔ Mobile Responsive</div>
        <div>✔ Premium UI Design</div>
      </div>

      <button id="payBtn">
        Pay Securely
      </button>

      <div class="secure">
        🔒 100% Secure Payment
      </div>

    </div>

    <script>

      document.getElementById("payBtn").onclick = async function () {

        const btn = document.getElementById("payBtn");

        btn.innerHTML = "Processing...";
        btn.disabled = true;

        try {

          const res = await fetch("/create-order", {
            method: "POST"
          });

          const data = await res.json();

          const options = {

            key: "${KEY_ID}",

            amount: data.order.amount,

            currency: "INR",

            name: "My Project",

            description: "Premium Plan Payment",

            order_id: data.order.id,

            handler: async function(response){

              const verifyRes = await fetch("/verify-payment",{
                method:"POST",
                headers:{
                  "Content-Type":"application/json"
                },
                body:JSON.stringify(response)
              });

              const verifyData = await verifyRes.json();

              if(verifyData.success){

                alert("✅ Payment Successful Done");

              }else{

                alert("❌ Payment Verification Failed");
              }
            },

            theme:{
              color:"#0ea5e9"
            }

          };

          const rzp = new window.Razorpay(options);

          rzp.open();

          btn.innerHTML = "Pay Securely";
          btn.disabled = false;

        } catch(err){

          console.log(err);

          alert("Something went wrong");

          btn.innerHTML = "Pay Securely";
          btn.disabled = false;
        }

      }

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