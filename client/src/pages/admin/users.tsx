import { Permission } from '@project/shared';
import { UsersAdmin } from '../../components/modules/admin/UsersAdmin';
import { withAuth } from '../../components/layout/with-auth';

export default withAuth(UsersAdmin, Permission.UsersRead);
