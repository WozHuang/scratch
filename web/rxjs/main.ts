import {
  BehaviorSubject,
  from,
  fromEvent,
  map,
  Observable,
  Subscription,
  of,
  ReplaySubject,
  share,
  Subject,
  mergeMap, skip
} from 'rxjs';

let behaviorSubject = new BehaviorSubject<string | null>(null);
const request = () => {
  setTimeout(() => {
    behaviorSubject.next('data: ' + new Date().toLocaleTimeString());
  }, 300);
  return behaviorSubject;
};

let obp = new Observable(subscriber => {
  setTimeout(() => {
    subscriber.next('data: ' + new Date().toLocaleTimeString());
    subscriber.complete();
  }, 300);
})

let replaySubject = new ReplaySubject<string | null>(1);
const callReplay = () => {
  // obp.subscribe(replaySubject);
  setTimeout(() => {
    replaySubject.next('data: ' + new Date().toLocaleTimeString());
  }, 300);
  return replaySubject.pipe(skip(1));
}
const ajax = new Observable((subscriber) => {
  setTimeout(() => {
    subscriber.next('data: ' + new Date().toLocaleTimeString());
  }, 300);
});
const ajax$ = new Subject();
ajax.subscribe(ajax$);
ajax$.subscribe((d) => {
  console.log('[ajax]', 'global', d);
});
request().subscribe((d) => {
  console.log('[request]', 'global', d);
})
callReplay().subscribe((d) => {
  console.log('[replaySubject]', 'global', d);
});
fromEvent(document, 'click').subscribe(() => {
  ajax$.subscribe((d) => {
    console.log('[ajax]', 'click', d);
  });
  let s = request().subscribe((d) => {
    console.log('[request]', 'click', d);
  });
  s.unsubscribe();
  let s2 = callReplay().subscribe((d) => {
    console.log('[replaySubject]', 'click', d);
    // s2.unsubscribe();
  });
});

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
