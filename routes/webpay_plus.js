var express = require("express");
var router = express.Router();
var controller = require("../controllers/webpay_plus");
const WebpayPlus = require("transbank-sdk").WebpayPlus;

router.get("/create", controller.create);
router.get("/commit", controller.commit);
//router.post("/commit", controller.commit);

module.exports = router;
