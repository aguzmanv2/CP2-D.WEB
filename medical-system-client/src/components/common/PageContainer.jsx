import { classNames } from '../../utils/classNames.js';

export default function PageContainer({ className, children }) {
  return <div className={classNames('app-page', className)}>{children}</div>;
}
