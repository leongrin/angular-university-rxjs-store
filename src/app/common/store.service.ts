import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, timer} from 'rxjs';
import {Course} from '../model/course';
import {createHttpObservable} from './util';
import {delayWhen, filter, map, retryWhen, shareReplay, tap} from 'rxjs/operators';
import {fromPromise} from 'rxjs/internal-compatibility';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private subject = new BehaviorSubject<Course[]>([]);

  courses$: Observable<Course[]> = this.subject.asObservable();

  constructor() {
  }

  init() {
    const http$ = createHttpObservable('/api/courses');

    http$
      .pipe(
        tap(() => console.log("HTTP request executed")),
        map(res => Object.values(res["payload"]))
      )
      .subscribe(courses => {
        this.subject.next(courses);
      })
  }

  selectCourses(courseLevel: string) {
    console.log(`courseLevel => ${courseLevel}`);
    return this.courses$
      .pipe(
        map(courses => courses.filter(course => course.category == courseLevel))
      );
  }

  selectCourseById(courseId: number): Observable<Course> {
    console.log(`Inside selectCourseById for courseId => ${courseId}`);
    return this.courses$
      .pipe(
        map(courses => courses.find(course => course.id === courseId)),
        filter(course => !!course)
      );
  }

  saveCourse(courseId: number, modifiedCourse: Course) {
    const courses = this.subject.getValue();
    const newCourses = courses.map(course => course.id === courseId ? course = {...course, ...modifiedCourse} : course);
    this.subject.next(newCourses);

    return fromPromise(fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(modifiedCourse),
      headers: {
        'content-type': 'application/json'
      }
    }));
  }


}
