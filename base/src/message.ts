import axios from 'axios';

const url = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send'

export class WeChatBot {
  constructor(private key: string) {}
  async sendText(message: string) {
    const data = {"msgtype": "text", "text": { "content": message } }
    const res = await axios.post(url, data, { params: { key: this.key } });
    return res.data;
  }
}
