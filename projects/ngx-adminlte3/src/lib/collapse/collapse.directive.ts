import {
  AnimationBuilder,
  AnimationFactory,
  AnimationPlayer
} from '@angular/animations';

import {
  AfterViewChecked,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  Renderer2,
  AfterContentInit
} from '@angular/core';

import {
  collapseAnimation,
  expandAnimation
} from './collapse-animations';

@Directive({
  selector: '[ngxlte3Collapse]',
  exportAs: 'ngxlte3-collapse',
  host: {
    '[class.collapse]': 'true'
  }
})
export class NgxLTE3CollapseDirective implements AfterViewChecked, AfterContentInit {
  
  /** This event fires as soon as content collapses */
  @Output() collapsed: EventEmitter<NgxLTE3CollapseDirective> = new EventEmitter();
  /** This event fires when collapsing is started */
  @Output() collapses: EventEmitter<NgxLTE3CollapseDirective> = new EventEmitter();
  /** This event fires as soon as content becomes visible */
  @Output() expanded: EventEmitter<NgxLTE3CollapseDirective> = new EventEmitter();
  /** This event fires when expansion is started */
  @Output() expands: EventEmitter<NgxLTE3CollapseDirective> = new EventEmitter();

  // shown
  @HostBinding('class.in')
  @HostBinding('class.show')
  @HostBinding('attr.aria-expanded')
  isExpanded = true;
  // hidden
  @HostBinding('attr.aria-hidden') isCollapsed = false;
  // stale state
  @HostBinding('class.collapse') isCollapse = true;
  // animation state
  @HostBinding('class.collapsing') isCollapsing = false;

  @Input()
  set display(value: string) {
    if (!this.isAnimated) {
      this._renderer.setStyle(this._el.nativeElement, 'display', value);

      return;
    }

    this._display = value;

    if (value === 'none') {
      this.hide();

      return;
    }

    this.show();
  }
  /** turn on/off animation */
  @Input() isAnimated = false;
  /** A flag indicating visibility of content (shown or hidden) */
  @Input()
  set ngxlte3Collapse(value: boolean) {
    if (!this._player || this._isAnimationDone) {
      this.isExpanded = value;
      this.toggle();
    }
  }

  get ngxlte3Collapse(): boolean {
    return this.isExpanded;
  }

  private _display = 'block';
  private _factoryCollapseAnimation: AnimationFactory;
  private _factoryExpandAnimation: AnimationFactory;
  private _isAnimationDone: boolean;
  private _player: AnimationPlayer;
  private _stylesLoaded = false;

  private _COLLAPSE_ACTION_NAME = 'collapse';
  private _EXPAND_ACTION_NAME = 'expand';

  constructor(
    private _el: ElementRef,
    private _renderer: Renderer2,
    _builder: AnimationBuilder
  ) {
    this._factoryCollapseAnimation = _builder.build(collapseAnimation);
    this._factoryExpandAnimation = _builder.build(expandAnimation);
  }

  ngAfterViewChecked(): void {
    this._stylesLoaded = true;

    if (!this._player || !this._isAnimationDone) {
      return;
    }

    this._player.reset();
    this._renderer.setStyle(this._el.nativeElement, 'height', '*');
  }

  ngAfterContentInit(): void {
    // this._stylesLoaded = true;

    // if (!this._player || !this._isAnimationDone) {
    //   return;
    // }

    // this._player.reset();
    // this._renderer.setStyle(this._el.nativeElement, 'height', '*');
  }
  
  /** allows to manually toggle content visibility */
  toggle(): void {
    if (this.isExpanded) {
      this.hide();
    } else {
      this.show();
    }
  }

  /** allows to manually hide content */
  hide(): void {
    this.isCollapsing = true;
    this.isExpanded = false;
    this.isCollapsed = true;
    this.isCollapsing = false;

    this.collapses.emit(this);

    this._isAnimationDone = false;

    this.animationRun(this.isAnimated, this._COLLAPSE_ACTION_NAME)(() => {
      this._isAnimationDone = true;
      this.collapsed.emit(this);
      this._renderer.setStyle(this._el.nativeElement, 'display', 'none');
    });
  }
  /** allows to manually show collapsed content */
  show(): void {
    this._renderer.setStyle(this._el.nativeElement, 'display', this._display);

    this.isCollapsing = true;
    this.isExpanded = true;
    this.isCollapsed = false;
    this.isCollapsing = false;

    this.expands.emit(this);

    this._isAnimationDone = false;

    this.animationRun(this.isAnimated, this._EXPAND_ACTION_NAME)(() => {
      this._isAnimationDone = true;
      this.expanded.emit(this);
    });
  }

  animationRun(isAnimated: boolean, action: string) {
    if (!isAnimated || !this._stylesLoaded) {
      return (callback: () => void) => callback();
    }

    this._renderer.setStyle(this._el.nativeElement, 'overflow', 'hidden');
    this._renderer.addClass(this._el.nativeElement, 'collapse');

    const factoryAnimation = (action === this._EXPAND_ACTION_NAME)
      ? this._factoryExpandAnimation
      : this._factoryCollapseAnimation;

    if (this._player) {
      this._player.destroy();
    }

    this._player = factoryAnimation.create(this._el.nativeElement);
    this._player.play();

    return (callback: () => void) => this._player.onDone(callback);
  }
}
