// import { prisma } from '@/lib/prisma';
// import { PrismaAdapter } from '@next-auth/prisma-adapter';

import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { FirestoreAdapter } from '@auth/firebase-adapter';
import bcrypt from 'bcryptjs';
import { type NextAuthOptions, type User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { html, text } from '@/utils/htmlEmail';
import { sendEmail } from '@/utils/sendEmail';
import { db } from '@/firebase';


type FirestoreUserData = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  password?: string | null;
  role?: string | null;
  telephone?: string | null;
  emailVerified?: string | null;
};

type ExtendedUser = User & {
  id?: string | null;
  role?: string | null;
  telephone?: string | null;
};

export const authOptions: NextAuthOptions = {
  // * NO ADAPTER NEEDED - USING MANUAL USER MANAGEMENT
  // Email provider removed to avoid adapter requirement
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  // site: process.env.NEXTAUTH_URL,
  jwt: {
    // A secret to use for key generation (you should set this explicitly)
    secret: process.env.NEXTAUTH_SECRET,
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        console.log('inside credentuals');
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', credentials.email),
          limit(1)
        );
        const existingUsersSnapshot = await getDocs(usersQuery);

        if (existingUsersSnapshot.empty) {
          return null;
        }

        const userDoc = existingUsersSnapshot.docs[0];

        if (!userDoc) {
          return null;
        }

        const userData = userDoc.data() as FirestoreUserData;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          userData?.password ?? ''
        );

        if (!isPasswordValid) {
          return null;
        } 
        const userObj: User & {
          role?: string | null;
          telephone?: string | null;
        } = {
          id: userDoc.id,
          image: userData?.image ?? null,
          role: userData?.role ?? 'User',
          email: userData?.email ?? credentials.email,
          name: userData?.name ?? null,
          telephone: userData?.telephone ?? null,
        };

        return userObj;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      httpOptions: {
        timeout: 40000,
      },
    }),
    // EmailProvider removed - requires adapter which conflicts with manual user management
    // EmailProvider({
    //   server: process.env.EMAIL_SERVER,
    //   from: `${process.env.SITE_NAME}<${process.env.EMAIL_SERVER_USER}>`,
    //   maxAge: 24 * 60 * 60,
    //   async sendVerificationRequest({
    //     identifier: email,
    //     url,
    //     provider: { server, from },
    //   }) {
    //     const { host } = new URL(url);

    //     const sendEmailObj = await sendEmail({
    //       to: email,
    //       from: from,
    //       subject: `Sign in to ${host}`,
    //       text: text({ url, host }),
    //       html: html({ url, host, email }),
    //     });
    //   },
    // }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
       

      if (account?.provider === 'google') { 

        try {
          // Check if user exists in our Firestore database
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', user.email),
            limit(1)
          );
          const existingUsersSnapshot = await getDocs(usersQuery);

          if (existingUsersSnapshot.empty) {
            // Create new user in Firestore
            const timestamp = Date.now();
            const dateObject = new Date(timestamp);
            const date = dateObject.getDate();
            const month = dateObject.getMonth() + 1;
            const year = dateObject.getFullYear();
            const hour = dateObject.getHours();
            const minute = dateObject.getMinutes();
            const second = dateObject.getSeconds();

            await addDoc(collection(db, 'users'), {
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: `${year}-${month}-${date} ${hour}:${minute}:${second}`,
              role: 'User',
              googleId: account.providerAccountId,
            });

            console.log('New Google user created in Firestore');
          } else {
            console.log('Existing Google user found in Firestore');
          }
        } catch (error) {
          console.error('Error handling Google user:', error);
          return false; // Deny sign in if we can't handle the user
        }
      }

      return true;
    },
    session: async ({ session, token }) => {
      const userEmail = session.user?.email;

      if (!userEmail) {
        return session;
      }

      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', userEmail),
        limit(1)
      );
      const existingUsersSnapshot = await getDocs(usersQuery);

      if (existingUsersSnapshot.empty) {
        console.log('No user found in session callback for:', userEmail);
        return session;
      }

      const userDoc = existingUsersSnapshot.docs[0];
      const dbUser = userDoc.data() as FirestoreUserData;

      return {
        ...session,
        user: {
          image: dbUser.image ?? session.user?.image ?? null,
          role: dbUser?.role ?? 'User',
          email: dbUser?.email ?? userEmail,
          name: dbUser?.name ?? session.user?.name ?? null,
          id: userDoc?.id,
          telephone: dbUser?.telephone ?? null,
        },
      };
    },

    jwt: async ({ token, user }) => {
      if (user) {
        const extendedUser = user as ExtendedUser;
        return {
          ...token,
          id: extendedUser.id ?? token.id,
          role: extendedUser.role ?? token.role ?? 'User',
        };
      }

      // For subsequent requests, get role from database if not in token
      if (token.email && !token.role) {
        try {
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', token.email),
            limit(1)
          );
          const existingUsersSnapshot = await getDocs(usersQuery);

          if (!existingUsersSnapshot.empty) {
            const userDoc = existingUsersSnapshot.docs[0];
            const userData = userDoc.data() as FirestoreUserData;
            token.role = userData.role || 'User';
            token.id = userDoc.id;
          }
        } catch (error) {
          console.error('Error fetching user role for JWT:', error);
        }
      }

      return token;
    },
  },
  events: {
    async signIn(message) {
      console.log('Sign in event:', message);
    },
    async signOut(message) {
      console.log('Sign out event:', message);
    },
    async createUser(message) {
      console.log('Create user event:', message);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
