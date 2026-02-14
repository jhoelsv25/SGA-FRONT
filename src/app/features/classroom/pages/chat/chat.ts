import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomSocketService } from '../../services/classroom-socket';
import { AuthStore } from '@auth/services/store/auth.store';

@Component({
  selector: 'sga-classroom-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Chat implements OnInit {
  public readonly store = inject(ClassroomStore);
  public readonly authStore = inject(AuthStore);
  private readonly socket = inject(ClassroomSocketService);
  public newMessage = signal('');

  public mockMessages = [
    { id: '1', senderName: 'Prof. Juan Lopez', content: 'Hola a todos, ¿tienen dudas con la tarea?', isMe: false, timestamp: '10:00 AM' },
    { id: '2', senderName: 'Maria Garcia', content: 'Sí profesor, la pregunta 4 está un poco difícil.', isMe: false, timestamp: '10:05 AM' },
  ];

  ngOnInit(): void {
    // History is loaded by the parent component (Classroom) via loadChat
    void 0;
  }

  sendMessage() {
    const user = this.authStore.currentUser();
    const sectionId = this.store.selectedSectionId();
    
    if (this.newMessage() && user && sectionId) {
      const msg = {
        id: Date.now().toString(),
        content: this.newMessage(),
        senderName: `${user.firstName} ${user.lastName}`,
        isMe: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      this.socket.sendMessage(sectionId, {
        room: sectionId,
        userId: user.id,
        message: msg
      });
      
      this.newMessage.set('');
    }
  }
}
