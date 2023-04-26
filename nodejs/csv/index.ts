import { stringify } from 'csv';
import { createWriteStream } from 'fs-extra';
import * as path from 'path';

const stringifier = stringify({
  delimiter: '|'
});

stringifier.pipe(createWriteStream(path.resolve(__dirname, './temp.csv'), { encoding: 'utf-8', flags: 'a' }));

// Write records to the stream
stringifier.write(['root', 'x', '0', '0', 'root', '/root', '/bin/bash']);
stringifier.write(['someone', 'x', '1022', '1022', '', '"|/home/someone', '/bin/bash']);
// Close the writable stream
stringifier.end();
