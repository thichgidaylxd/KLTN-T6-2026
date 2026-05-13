import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import IntroSection from "@/components/landing/IntroSection";
import ServicesSection from "@/components/landing/ServicesSection";
import ContactSection from "@/components/landing/ContactSection";
import CornBackground from "@/assets/Corn-Background.png";

const HomePage: React.FC = () => {
  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      {/* Background wrapper for Navbar + HeroSection */}
      <div
        className="relative w-full min-h-[115vh]"
        style={{
          backgroundImage: `url(${CornBackground})`,
          backgroundSize: "100% 115%",
          backgroundPosition: "center top",
          backgroundAttachment: "scroll",
        }}
      >
        {/* Navbar */}
        <Navbar />

        {/* Hero Section */}
        <HeroSection />
      </div>

      {/* Rest of the page */}
      <div className="relative bg-white">
        <IntroSection />
        <ServicesSection />
        <ContactSection />
      </div>
    </div>
  );
};

export default HomePage;
