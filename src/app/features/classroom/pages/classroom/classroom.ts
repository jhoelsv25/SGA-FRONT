import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomSocketService } from '../../services/classroom-socket';
import type { ClassroomFeedItem } from '../../types/classroom-types';

@Component({
  selector: 'sga-classroom',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './classroom.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Classroom implements OnInit {
  private readonly route = inject(ActivatedRoute);
  public readonly store = inject(ClassroomStore);
  private readonly socket = inject(ClassroomSocketService);

  public sectionId: string = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.sectionId = params['id'];
      if (this.sectionId) {
        this.store.loadFeed(this.sectionId);
        this.store.loadChat(this.sectionId);
        this.socket.connect(this.sectionId);
        
        // Listen to real-time updates
        this.socket.message$.subscribe(msg => this.store.receiveMessage(msg));
        this.socket.feedUpdate$.subscribe(item =>
          this.store.receiveFeedUpdate(item as ClassroomFeedItem)
        );
      }
    });
  }
}
