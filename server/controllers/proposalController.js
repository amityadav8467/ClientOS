const Proposal = require("../models/Proposal");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createNotification } = require("../utils/notificationHelper");
const { sendEmail, proposalEmailTemplate } = require("../utils/email");

const generateProposal = async (req, res) => {
  try {
    const { clientId, projectId, title, clientName, businessType, scope, budget, timeline } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Gemini API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a professional web agency proposal writer for Codexora Solutions, a modern web development agency.
Generate a detailed, professional project proposal in markdown format for:

Client: ${clientName}
Business Type: ${businessType}
Project Scope: ${scope}
Budget Range: ${budget}
Timeline: ${timeline}

Include these sections with proper markdown formatting:
# Project Proposal

## Executive Summary
## About Codexora Solutions
## Project Scope & Objectives  
## Deliverables
## Timeline & Milestones
## Pricing Breakdown
## Our Process
## Terms & Conditions

Be specific, persuasive, and professional. Use bullet points and tables where appropriate.
    `;

    const result = await model.generateContent(prompt);
    const generatedContent = result.response.text();

    const proposal = await Proposal.create({
      client: clientId,
      project: projectId || undefined,
      title,
      inputData: { clientName, businessType, scope, budget, timeline },
      generatedContent,
      status: "draft",
      createdBy: req.user._id,
    });

    // Fire notification
    await createNotification({
      userId: req.user._id,
      message: `AI Proposal generated for ${clientName}`,
      type: "proposal",
      link: `/proposals/${proposal._id}`,
    });

    res.status(201).json({ success: true, proposal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ createdBy: req.user._id })
      .populate("client", "name email")
      .populate("project", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, proposals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate("client", "name email businessType")
      .populate("project", "title");
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    res.json({ success: true, proposal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProposalStatus = async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate("client", "name email");

    // Email client when proposal is sent
    if (req.body.status === "sent" && proposal.client?.email) {
      sendEmail({
        to: proposal.client.email,
        subject: `Project Proposal from Codexora Solutions`,
        html: proposalEmailTemplate(proposal),
      });
    }

    // Notify admin on approval/rejection
    if (["approved", "rejected"].includes(req.body.status) && req.user) {
      await createNotification({
        userId: req.user._id,
        message: `Proposal "${proposal.title}" was ${req.body.status}`,
        type: "proposal",
        link: `/proposals/${proposal._id}`,
      });
    }

    res.json({ success: true, proposal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const deleteProposal = async (req, res) => {
  try {
    await require("../models/Proposal").findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Proposal deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateProposal, getProposals, getProposalById, updateProposalStatus, deleteProposal };
