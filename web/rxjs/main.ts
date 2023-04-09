import { from, fromEvent, map, of, Subject } from 'rxjs';

fromEvent(document, 'click').subscribe(() => console.log('Clicked!'));

let ob = of(123, 456);
ob = from([234, 567]);
ob.subscribe((n) => {
  console.log('before', n);
});
ob.pipe(map((a) => a * 10)).subscribe((n) => {
  console.log('after', n);
});

let sj = new Subject();
sj.next(3);
