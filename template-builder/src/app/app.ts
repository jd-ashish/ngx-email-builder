import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EmailTemplateBuilderComponent } from 'ngx-email-builder';
@Component({
  selector: 'app-root',
  imports: [EmailTemplateBuilderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'template-builder';
  handleManualSave(data: any) {
    // You can handle the template data locally
    console.log('Template Data:', data.jsonContent);
    console.log('Generated HTML:', data.htmlContent);
  }
}
