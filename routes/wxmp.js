var express = require('express');
const axios = require('axios');
var router = express.Router();
const WXBizDataCrypt = require('./WXBizDataCrypt'); // 引入微信官方提供的解密类

const APPID = process.env.WXMP_APPID || ''
const SECRET = process.env.WXMP_SECRET || ''

router.post('/getPhoneNumber', async (req, res) => {
    try {
        const { code, encryptedData, iv } = req.body;

        // 使用code换取session_key和openid
        const { session_key } = await getOpenidAndToken(code);
        
        // 使用session_key解密手机号
        const telephone = decryptPhoneNumber(session_key, encryptedData, iv);
    
        res.json({telephone});
    } catch (error) {
        res.status(500).send(error.message || error);
    }
});

router.post('/getOpenidAndToken', async (req, res) => {
    try {
        const code = req.body.code; // 获取微信回调返回的授权码

        // 使用code换取session_key和openid
        const data = await getOpenidAndToken(code);
        
        if (!data.session_key || !data.openid) {
            throw new Error('Failed to exchange code for session_key and openid');
        }
    
        res.json({
            openid: data.openid,
            unionid: data.unionid || ''
        });
    } catch (error) {
      res.status(500).send(error.message || error);
    }
});

// 获取openid、session_key和unionid
async function getOpenidAndToken(code) {
  if(!APPID || !SECRET) {
    throw new Error("服务环境变量配置APPID或SECRET缺失！")
    return
  }

  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    throw error
  }
}

// 解码手机号
function decryptPhoneNumber(session_key, encryptedData, iv) {
  if(!APPID) {
    throw new Error("服务环境变量配置APPID缺失！")
    return
  }

  const pc = new WXBizDataCrypt(APPID, session_key);
  
  const data = pc.decryptData(encryptedData, iv);

  if (data.countryCode && data.purePhoneNumber) {
    return `(+${data.countryCode})${data.purePhoneNumber}`
  } else {
    throw new Error(`Failed to decrypt phoneNumber: ${errCode}`);
  }
}

module.exports = router;
