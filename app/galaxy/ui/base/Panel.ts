/**
 * Abstract base class for UI overlay panels.
 * Provides consistent show/hide/destroy lifecycle and styling foundation.
 */
export abstract class Panel {
  protected element: HTMLDivElement;
  protected container: HTMLElement;
  protected isVisible: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createElement();
    this.setupStyles();
    this.setupEventListeners();
    this.container.appendChild(this.element);
    
    // Start hidden by default
    this.hide();
  }

  /**
   * Creates the panel's root DOM element with content structure.
   * Must be implemented by subclasses.
   * @returns The root HTMLDivElement for this panel.
   */
  protected abstract createElement(): HTMLDivElement;

  /**
   * Updates the panel's content with new data.
   * Must be implemented by subclasses.
   * @param data Data object to update panel with (type varies by panel implementation).
   */
  abstract update(data: unknown): void;

  /**
   * Sets up base panel styles (glassmorphism design).
   * Subclasses can override to add custom styling.
   */
  protected setupStyles(): void {
    Object.assign(this.element.style, {
      position: 'fixed',
      background: 'rgba(0, 0, 0, 0.7)', // Semi-transparent pure OLED black
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)', // Safari support
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px',
      color: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: '14px',
      lineHeight: '1.5',
      transition: 'opacity 300ms ease, transform 300ms ease',
      zIndex: '1000',
      pointerEvents: 'auto',
      userSelect: 'none',
    });
  }

  /**
   * Sets up event listeners for the panel.
   * Subclasses can override to add custom event handling.
   */
  protected setupEventListeners(): void {
    // Base implementation does nothing
    // Subclasses override to add specific interactions
  }

  /**
   * Shows the panel with a smooth fade-in animation.
   */
  show(): void {
    if (this.isVisible) return;

    this.element.style.display = 'block';
    // Force reflow for transition
    void this.element.offsetHeight;
    this.element.style.opacity = '1';
    this.element.style.transform = 'translateY(0)';
    this.isVisible = true;
  }

  /**
   * Hides the panel with a smooth fade-out animation.
   */
  hide(): void {
    if (!this.isVisible && this.element.style.display === 'none') return;

    this.element.style.opacity = '0';
    this.element.style.transform = 'translateY(-10px)';
    
    // Wait for transition before hiding completely
    setTimeout(() => {
      if (!this.isVisible) {
        this.element.style.display = 'none';
      }
    }, 300);
    
    this.isVisible = false;
  }

  /**
   * Toggles panel visibility.
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Checks if the panel is currently visible.
   * @returns True if visible, false otherwise.
   */
  isShown(): boolean {
    return this.isVisible;
  }

  /**
   * Destroys the panel, removing it from the DOM and cleaning up resources.
   * This method is idempotent and safe to call multiple times.
   */
  destroy(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.isVisible = false;
  }

  /**
   * Gets the panel's root DOM element.
   * Useful for advanced positioning or styling adjustments.
   */
  getElement(): HTMLDivElement {
    return this.element;
  }

  /**
   * Sets the panel's position.
   * @param top CSS top value (e.g., '20px', '10%').
   * @param left CSS left value (e.g., '20px', '10%').
   * @param right CSS right value (optional).
   * @param bottom CSS bottom value (optional).
   */
  setPosition(top?: string, left?: string, right?: string, bottom?: string): void {
    if (top !== undefined) this.element.style.top = top;
    if (left !== undefined) this.element.style.left = left;
    if (right !== undefined) this.element.style.right = right;
    if (bottom !== undefined) this.element.style.bottom = bottom;
  }
}

