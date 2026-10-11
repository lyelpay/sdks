// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LyelPayButton } from './LyelPayButton';
import { CHECKOUT, checkoutFrame, launchParams } from './test/widget';

afterEach(() => {
  cleanup();
});

describe('LyelPayButton', () => {
  it('opens the modal on click', () => {
    render(<LyelPayButton publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} />);
    expect(checkoutFrame()).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Payer avec Lyel Pay' }));
    expect(launchParams().get('mode')).toBe('modal');
  });

  it('opens nothing while disabled', () => {
    render(<LyelPayButton publishableKey="pk_test_abc" sessionToken="st_1" checkoutUrl={CHECKOUT} disabled>Payer</LyelPayButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Payer' }));
    expect(checkoutFrame()).toBeNull();
  });
});
