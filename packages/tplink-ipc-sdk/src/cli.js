import { config } from 'dotenv'
import { TPLinkIPCApiClient } from './api.js'

config()

const action = process.argv[2]
if (!action || !['on', 'off', 'status'].includes(action)) {
  console.log('Usage: node src/cli.js <on|off|status>')
  process.exit(1)
}

const client = new TPLinkIPCApiClient(
  process.env.TPLINK_HOST,
  process.env.TPLINK_USERNAME,
  process.env.TPLINK_PASSWORD,
)

if (action === 'status') {
  const status = await client.getLensMaskStatus()
  console.log(status ? '已遮蔽' : '未遮蔽')
} else if (action === 'on') {
  await client.setLensMaskOn()
  console.log('已遮蔽')
} else {
  await client.setLensMaskOff()
  console.log('已取消遮蔽')
}
