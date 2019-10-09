import { IUser } from '../models/user';

export default function getUserName(user: IUser): string {
	return user.name || user.username;
}
