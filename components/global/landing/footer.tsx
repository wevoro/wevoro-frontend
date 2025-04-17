"use client";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Linkedin, Youtube } from "lucide-react";
import Container from "../container";
import Logo from "../logo";

export default function Footer({
  facebookLink,
  linkedinLink,
  youtubeLink,
  socialLabel,
  downloadAppLabel,
  appStoreLink,
  playStoreLink,
  section1,
  section2,
  section3,
  copyright,
  environmentType,
}: {
  facebookLink: string;
  linkedinLink: string;
  youtubeLink: string;
  socialLabel: string;
  downloadAppLabel: string;
  appStoreLink: string;
  playStoreLink: string;
  section1: any;
  section2: any;
  section3: any;
  copyright: string;
  environmentType: string;
}) {
  const sections = [section1, section2, section3];

  const socialLinks = [
    {
      icon: <Facebook className="h-6 w-6" />,
      name: "Facebook",
      href: facebookLink,
    },
    {
      icon: <Linkedin className="h-6 w-6" />,
      name: "LinkedIn",
      href: linkedinLink,
    },
    {
      icon: <Youtube className="h-6 w-6" />,
      name: "YouTube",
      href: youtubeLink,
    },
  ];

  const appLinks = [
    {
      src: "/appstore-outlined.svg",
      alt: "Download on the App Store",
      href: appStoreLink,
    },
    {
      src: "/playstore-outlined.svg",
      alt: "Get it on Google Play",
      href: playStoreLink,
    },
  ];

  return (
    <footer className="w-full bg-primary text-white">
      <Container className="py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 text-center md:text-left md:grid-cols-4">
          <div>
            <Logo className="text-white" />
          </div>

          {sections?.map((section: any, index: number) => (
            <div key={index} className="space-y-8">
              <h3 className="text-lg md:text-xl font-semibold">
                {section.title}
              </h3>
              <ul className="list-none space-y-4 font-medium text-sm md:text-base pl-0">
                {section?.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex} className="list-none ">
                    <Link href={link.link}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 text-center md:text-left md:grid-cols-4">
          <div></div>
          {/* <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>{socialLabel}</h3>
            <div className='flex gap-4 justify-center md:justify-start'>
              {socialLinks.map((social: any, index: number) => (
                <Link
                  key={index}
                  href={social.href}
                  target='_blank'
                  className='hover:opacity-75'
                >
                  {social.icon}
                  <span className='sr-only'>{social.name}</span>
                </Link>
              ))}
            </div>
          </div> */}

          {environmentType !== "waitlist" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{downloadAppLabel}</h3>
              <div className="flex gap-4 justify-center md:justify-start">
                {appLinks.map((app: any, index: number) => (
                  <Link
                    key={index}
                    href={app.href}
                    target="_blank"
                    className="hover:opacity-75"
                  >
                    <Image
                      src={app.src}
                      alt={app.alt}
                      width={120}
                      height={40}
                      className="h-10"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 text-sm text-center md:text-left grid grid-cols-1 md:grid-cols-4">
          <div></div>
          <p>{copyright}</p>
        </div>
      </Container>
    </footer>
  );
}
