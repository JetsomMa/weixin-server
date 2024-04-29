var express = require('express');
const axios = require('axios');
var router = express.Router();

const APPID = process.env.WEB_APPID || ''
const SECRET = process.env.WEB_SECRET || ''
const REDIRECT_URI = process.env.WEB_REDIRECT_URI || ''

// 网站微信扫码登录
router.get('/wechat-login-qrcode', async (req, res) => {
  try {
      if(!APPID || !REDIRECT_URI) {
        res.status(500).send("服务环境变量配置APPID或REDIRECT_URI缺失！");
      } else {
        // 这里应该是调用微信 API 来获取授权 URL，并转换为二维码
        const wechatUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${APPID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect`;
        // 这里简化处理，直接返回 URL
        res.json({ url: wechatUrl });
      }
  } catch (error) {
      res.status(500).send(error.message || error);
  }
});

// 网站微信扫码登录回调接口，也就是用户扫码之后在手机上点击同意之后，需要进行重定向的目标URL
router.get('/wechat-callback', async (req, res) => {
  const code = req.query.code; // 获取微信回调返回的授权码
  try {
    if(!APPID || !SECRET) {
      res.status(500).send("服务环境变量配置APPID或SECRET缺失！");
    } else {
      // 使用授权码换取 access_token
      const tokenResponse = await axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${SECRET}&code=${code}&grant_type=authorization_code`);
      const accessToken = tokenResponse.data.access_token;
      const openId = tokenResponse.data.openid;

      // 这里可以根据 accessToken 和 openId 获取用户信息，并进行登录处理
      res.json({ accessToken, openId });
    }
  } catch (error) {
    res.status(500).send(error.message || error);
  }
});

module.exports = router;
