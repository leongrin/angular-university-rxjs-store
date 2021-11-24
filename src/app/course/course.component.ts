import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Course} from "../model/course";
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  tap,
  delay,
  map,
  concatMap,
  switchMap,
  withLatestFrom,
  concatAll, shareReplay
} from 'rxjs/operators';
import {merge, fromEvent, Observable, concat} from 'rxjs';
import {Lesson} from '../model/lesson';
import {createHttpObservable} from '../common/util';
import {StoreService} from '../common/store.service';


@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
export class CourseComponent implements OnInit, AfterViewInit {

  courseId: number;

  course$: Observable<Course>;

  lessons$: Observable<Lesson[]>;


  @ViewChild('searchInput', {static: true}) input: ElementRef;

  constructor(private route: ActivatedRoute,
              private storeServ: StoreService) {


  }

  ngOnInit() {

    this.courseId = +this.route.snapshot.params['id'];

    this.course$ = this.storeServ.selectCourseById(this.courseId); /*createHttpObservable(`/api/courses/${this.courseId}`);*/

    this.loadLessons()
      .pipe(
        withLatestFrom(this.course$)  // Combines the source Observable with other Observables to create an Observable whose values are calculated from the latest values of each, only when the source emits.
      )
      .subscribe(([lessons, course]) => {
        console.log(`Lessons => ${lessons}`);
        console.log(`Course => ${course}`);
      })
  }

  ngAfterViewInit() {

    const searchLessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
      .pipe(
        map(event => event.target.value),
        debounceTime(400),  // wait some time until the operator is stable (doesn't change)
        distinctUntilChanged(),  // avoid duplicates
        switchMap(search => this.loadLessons(search))
      );

    const initialLessons$ = this.loadLessons();

    this.lessons$ = concat(initialLessons$, searchLessons$);

  }

  loadLessons(search = ''): Observable<Lesson[]> {
    return createHttpObservable(
      `/api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`)
      .pipe(
        map(res => res["payload"])
      );
  }


}











