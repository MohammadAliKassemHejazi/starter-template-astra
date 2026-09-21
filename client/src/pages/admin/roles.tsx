import { Permission } from '@project/shared';
import { RolesAdmin } from '../../components/modules/admin/RolesAdmin';
import { withAuth } from '../../components/layout/with-auth';

export default withAuth(RolesAdmin, Permission.RolesRead);
