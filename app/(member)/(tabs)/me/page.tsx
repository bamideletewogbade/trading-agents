import { ME } from '@/content/member';
import { Me } from '@/components/member/Me';

export const metadata = { title: ME.meta.title };

export default function MePage() {
  return <Me />;
}
