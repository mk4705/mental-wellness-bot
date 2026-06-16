import { render, screen } from '@testing-library/react';
import { EmotionBadge } from './components/common/EmotionBadge';

test('renders emotion badge with label and confidence score', () => {
  render(<EmotionBadge label="joy" score={0.95} />);
  expect(screen.getByText(/joy/i)).toBeInTheDocument();
  expect(screen.getByText(/95%/i)).toBeInTheDocument();
});
